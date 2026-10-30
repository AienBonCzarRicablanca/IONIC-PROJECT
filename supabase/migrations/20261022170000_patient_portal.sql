-- Patient portal helpers: dentist names, availability, cancellation, reminders.

-- Active dentists of the caller's clinic, exposing only name and specialization.
create or replace function public.list_bookable_dentists()
returns table (id uuid, full_name text, specialization text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, coalesce(nullif(trim(p.full_name), ''), 'Dentist'), d.specialization
  from public.dentists d
  join public.profiles p on p.id = d.profile_id
  where d.is_active
    and p.is_active
    and exists (
      select 1 from public.clinic_memberships cm
      where cm.user_id = (select auth.uid())
        and cm.clinic_id = d.clinic_id
        and cm.is_active
    )
  order by 2;
$$;

-- Busy time ranges only (no patient data) so patients can pick a free slot.
create or replace function public.dentist_busy_slots(p_dentist uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.dentist_id = p_dentist
    and a.status not in ('cancelled', 'no_show')
    and a.starts_at < p_to
    and a.ends_at > p_from
    and p_to - p_from <= interval '31 days'
    and exists (
      select 1 from public.clinic_memberships cm
      where cm.user_id = (select auth.uid())
        and cm.clinic_id = a.clinic_id
        and cm.is_active
    )
  order by a.starts_at;
$$;

-- Clinic rule: patients may cancel their own pending/confirmed appointment at least 24 hours ahead.
create or replace function public.cancel_my_appointment(p_appointment uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  appt public.appointments%rowtype;
begin
  select a.* into appt
  from public.appointments a
  join public.patients p on p.id = a.patient_id and p.clinic_id = a.clinic_id
  where a.id = p_appointment
    and p.profile_id = (select auth.uid());

  if not found then
    raise exception 'Appointment not found.';
  end if;
  if appt.status not in ('pending', 'confirmed') then
    raise exception 'This appointment can no longer be cancelled.';
  end if;
  if appt.starts_at < now() + interval '24 hours' then
    raise exception 'Appointments can only be cancelled at least 24 hours in advance. Please call the clinic.';
  end if;

  update public.appointments set status = 'cancelled' where id = appt.id;
end;
$$;

-- Creates one reminder per appointment starting in the next 24-48 hours. Run on a schedule (e.g. pg_cron / Edge Function).
create or replace function app_private.queue_appointment_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted integer;
begin
  insert into public.notifications (clinic_id, user_id, title, message)
  select a.clinic_id, p.profile_id, 'Appointment reminder',
         'You have an appointment on ' || to_char(a.starts_at at time zone 'Asia/Manila', 'Mon DD, YYYY "at" HH12:MI AM') || '.'
  from public.appointments a
  join public.patients p on p.id = a.patient_id and p.clinic_id = a.clinic_id
  where p.profile_id is not null
    and a.status in ('pending', 'confirmed')
    and a.starts_at between now() + interval '24 hours' and now() + interval '48 hours'
    and not exists (
      select 1 from public.notifications n
      where n.user_id = p.profile_id
        and n.title = 'Appointment reminder'
        and n.message like '%' || to_char(a.starts_at at time zone 'Asia/Manila', 'Mon DD, YYYY "at" HH12:MI AM') || '%'
    );
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function public.list_bookable_dentists() from public, anon;
revoke all on function public.dentist_busy_slots(uuid, timestamptz, timestamptz) from public, anon;
revoke all on function public.cancel_my_appointment(uuid) from public, anon;
revoke all on function app_private.queue_appointment_reminders() from public, anon, authenticated;
grant execute on function public.list_bookable_dentists() to authenticated;
grant execute on function public.dentist_busy_slots(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;
