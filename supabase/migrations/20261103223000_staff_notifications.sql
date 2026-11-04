-- Notify front desk, the clinic owner, and the assigned dentist about clinic activity.

create or replace function app_private.clinic_role_user_ids(
  target_clinic uuid,
  allowed_roles public.app_role[]
)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(cm.user_id), array[]::uuid[])
  from public.clinic_memberships cm
  join public.profiles p on p.id = cm.user_id
  where cm.clinic_id = target_clinic
    and cm.is_active
    and p.is_active
    and cm.role = any(allowed_roles);
$$;

create or replace function app_private.notify_users(
  target_clinic uuid,
  target_users uuid[],
  notice_title text,
  notice_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (clinic_id, user_id, title, message)
  select target_clinic, member_id, notice_title, notice_message
  from unnest(target_users) as member_id
  where member_id is not null
    and not exists (
      select 1
      from public.notifications n
      where n.clinic_id = target_clinic
        and n.user_id = member_id
        and n.title = notice_title
        and n.message = notice_message
        and n.created_at > now() - interval '12 hours'
    );
end;
$$;

create or replace function app_private.notify_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_name text;
  when_label text;
  dentist_user uuid;
  notice_title text;
  notice_message text;
begin
  if tg_op = 'UPDATE' and (old.status = new.status or new.status <> 'cancelled') then
    return new;
  end if;

  select p.full_name into patient_name
  from public.patients p
  where p.id = new.patient_id
    and p.clinic_id = new.clinic_id;

  select d.profile_id into dentist_user
  from public.dentists d
  where d.id = new.dentist_id
    and d.clinic_id = new.clinic_id;

  when_label := to_char(new.starts_at at time zone 'Asia/Manila', 'Mon DD, YYYY "at" HH12:MI AM');

  if tg_op = 'INSERT' then
    notice_title := 'New appointment';
    notice_message := coalesce(patient_name, 'A patient') || ' booked a visit on ' || when_label || '.';
  else
    notice_title := 'Appointment cancelled';
    notice_message := coalesce(patient_name, 'A patient') || ' cancelled the visit on ' || when_label || '.';
  end if;

  perform app_private.notify_users(
    new.clinic_id,
    app_private.clinic_role_user_ids(new.clinic_id, array['superadmin', 'admin']::public.app_role[]),
    notice_title,
    notice_message
  );
  if dentist_user is not null then
    perform app_private.notify_users(new.clinic_id, array[dentist_user], notice_title, notice_message);
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_notify on public.appointments;
create trigger appointments_notify
  after insert or update of status on public.appointments
  for each row execute function app_private.notify_appointment_change();

create or replace function app_private.notify_contact_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app_private.notify_users(
    new.clinic_id,
    app_private.clinic_role_user_ids(new.clinic_id, array['superadmin', 'admin']::public.app_role[]),
    'New website message',
    new.sender_name || ' sent a message from the website.'
  );
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.contact_messages') is not null then
    execute 'drop trigger if exists contact_messages_notify on public.contact_messages';
    execute 'create trigger contact_messages_notify after insert on public.contact_messages for each row execute function app_private.notify_contact_message()';
  end if;
end $$;

create or replace function app_private.notify_low_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_name text;
  current_qty numeric;
  threshold numeric;
begin
  select i.name, i.quantity, i.reorder_threshold
  into item_name, current_qty, threshold
  from public.inventory_items i
  where i.id = new.item_id
    and i.clinic_id = new.clinic_id;

  if current_qty <= threshold and current_qty - new.quantity_change > threshold then
    perform app_private.notify_users(
      new.clinic_id,
      app_private.clinic_role_user_ids(new.clinic_id, array['superadmin', 'admin']::public.app_role[]),
      'Low stock',
      item_name || ' is down to ' || trim(to_char(current_qty, 'FM999999990.999')) || '. Reorder at ' || trim(to_char(threshold, 'FM999999990.999')) || '.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_low_stock_notify on public.inventory_transactions;
create trigger inventory_low_stock_notify
  after insert on public.inventory_transactions
  for each row execute function app_private.notify_low_stock();

revoke all on function app_private.clinic_role_user_ids(uuid, public.app_role[]) from public, anon, authenticated;
revoke all on function app_private.notify_users(uuid, uuid[], text, text) from public, anon, authenticated;
revoke all on function app_private.notify_appointment_change() from public, anon, authenticated;
revoke all on function app_private.notify_contact_message() from public, anon, authenticated;
revoke all on function app_private.notify_low_stock() from public, anon, authenticated;
