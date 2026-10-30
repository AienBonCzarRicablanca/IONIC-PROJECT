-- Staff accounts should not appear as patients. Remove the auto-created patient record
-- when it has no history; otherwise unlink it so history is preserved.

create or replace function app_private.detach_staff_patient_record(target_clinic uuid, target_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_row uuid;
  fk record;
  has_history boolean := false;
  found_rows boolean;
begin
  select p.id into patient_row
  from public.patients p
  where p.clinic_id = target_clinic and p.profile_id = target_user;

  if patient_row is null then
    return;
  end if;

  for fk in
    select c.conrelid::regclass::text as child_table, a.attname as child_column
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and c.confrelid = 'public.patients'::regclass
      and c.conkey[1] is not null
      and c.confkey[1] = (
        select attnum from pg_attribute
        where attrelid = 'public.patients'::regclass and attname = 'id'
      )
  loop
    execute format('select exists (select 1 from %s where %I = $1)', fk.child_table, fk.child_column)
      into found_rows using patient_row;
    if found_rows then
      has_history := true;
      exit;
    end if;
  end loop;

  if has_history then
    update public.patients set profile_id = null where id = patient_row;
  else
    delete from public.patients where id = patient_row;
  end if;
end;
$$;

create or replace function app_private.ensure_patient_record(target_clinic uuid, target_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.patients (clinic_id, profile_id, full_name, email)
  select target_clinic, p.id, coalesce(nullif(trim(p.full_name), ''), u.email), u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target_user
  on conflict (clinic_id, profile_id) do nothing;
end;
$$;

create or replace function public.set_staff_role(
  target_user uuid,
  new_role public.app_role,
  make_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_clinic uuid;
  current_role_value public.app_role;
begin
  select c.id into default_clinic from public.clinics c where c.is_default;

  if default_clinic is null
    or not app_private.has_clinic_role(default_clinic, array['superadmin']::public.app_role[]) then
    raise exception 'Only the clinic owner can change roles';
  end if;

  if target_user = (select auth.uid()) then
    raise exception 'You cannot change your own role';
  end if;

  if new_role not in ('admin', 'dentist', 'patient') then
    raise exception 'Role must be admin, dentist or patient';
  end if;

  select cm.role into current_role_value
  from public.clinic_memberships cm
  where cm.clinic_id = default_clinic and cm.user_id = target_user;

  if not found then
    raise exception 'This account is not a member of the clinic';
  end if;

  if current_role_value = 'superadmin' then
    raise exception 'The owner account cannot be changed';
  end if;

  update public.clinic_memberships
  set role = new_role, is_active = make_active
  where clinic_id = default_clinic and user_id = target_user;

  update public.profiles
  set role = new_role, is_active = make_active
  where id = target_user;

  if new_role = 'dentist' then
    insert into public.dentists (clinic_id, profile_id, is_active)
    values (default_clinic, target_user, make_active)
    on conflict (clinic_id, profile_id) do update set is_active = excluded.is_active;
  else
    update public.dentists
    set is_active = false
    where clinic_id = default_clinic and profile_id = target_user;
  end if;

  if new_role = 'patient' then
    perform app_private.ensure_patient_record(default_clinic, target_user);
  else
    perform app_private.detach_staff_patient_record(default_clinic, target_user);
  end if;
end;
$$;

revoke all on function public.set_staff_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.set_staff_role(uuid, public.app_role, boolean) to authenticated;

-- One-time cleanup for staff who were promoted before this migration.
select app_private.detach_staff_patient_record(cm.clinic_id, cm.user_id)
from public.clinic_memberships cm
where cm.role in ('admin', 'dentist');
