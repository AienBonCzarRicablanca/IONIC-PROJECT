-- Staff management for the clinic owner (superadmin).
-- Accounts are created through normal registration; the owner then assigns roles here.

create or replace function public.list_clinic_accounts()
returns table (
  user_id uuid,
  email text,
  full_name text,
  role public.app_role,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  default_clinic uuid;
begin
  select c.id into default_clinic from public.clinics c where c.is_default;

  if default_clinic is null
    or not app_private.has_clinic_role(default_clinic, array['superadmin']::public.app_role[]) then
    raise exception 'Only the clinic owner can list accounts';
  end if;

  return query
  select p.id, u.email::text, p.full_name, cm.role, (cm.is_active and p.is_active), u.created_at
  from public.clinic_memberships cm
  join public.profiles p on p.id = cm.user_id
  join auth.users u on u.id = cm.user_id
  where cm.clinic_id = default_clinic
  order by (cm.role = 'patient'), p.full_name, u.email;
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
end;
$$;

revoke all on function public.list_clinic_accounts() from public, anon;
revoke all on function public.set_staff_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.list_clinic_accounts() to authenticated;
grant execute on function public.set_staff_role(uuid, public.app_role, boolean) to authenticated;
