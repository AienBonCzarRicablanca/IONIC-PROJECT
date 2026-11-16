-- Patients and dentists were only told about a visit in narrow cases:
-- dentists on a new booking or a cancellation, patients only if a scheduled
-- reminder job ran. Status changes now reach both of them.

create or replace function app_private.notify_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_name text;
  patient_user uuid;
  dentist_user uuid;
  when_label text;
  staff_title text;
  staff_message text;
  dentist_title text;
  dentist_message text;
  patient_title text;
  patient_message text;
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then
    return new;
  end if;

  select p.full_name, p.profile_id
  into patient_name, patient_user
  from public.patients p
  where p.id = new.patient_id
    and p.clinic_id = new.clinic_id;

  select d.profile_id
  into dentist_user
  from public.dentists d
  where d.id = new.dentist_id
    and d.clinic_id = new.clinic_id;

  when_label := to_char(new.starts_at at time zone 'Asia/Manila', 'Mon DD, YYYY "at" HH12:MI AM');

  if tg_op = 'INSERT' then
    staff_title := 'New appointment';
    staff_message := coalesce(patient_name, 'A patient') || ' booked a visit on ' || when_label || '.';
    dentist_title := staff_title;
    dentist_message := staff_message;
    patient_title := 'Visit request received';
    patient_message := 'Your request for ' || when_label || ' was sent. The clinic will confirm it.';
  else
    staff_title := case new.status
      when 'confirmed' then 'Appointment confirmed'
      when 'cancelled' then 'Appointment cancelled'
      when 'completed' then 'Appointment completed'
      when 'no_show' then 'Appointment no-show'
      else 'Appointment updated'
    end;
    staff_message := coalesce(patient_name, 'A patient') || ' — ' || replace(new.status, '_', ' ')
      || ' for ' || when_label || '.';
    dentist_title := staff_title;
    dentist_message := staff_message;
    patient_title := case new.status
      when 'confirmed' then 'Visit confirmed'
      when 'cancelled' then 'Visit cancelled'
      when 'completed' then 'Visit completed'
      when 'no_show' then 'Missed visit'
      else 'Visit updated'
    end;
    patient_message := case new.status
      when 'confirmed' then 'Your visit on ' || when_label || ' is confirmed.'
      when 'cancelled' then 'Your visit on ' || when_label || ' was cancelled.'
      when 'completed' then 'Your visit on ' || when_label || ' is marked complete.'
      when 'no_show' then 'The clinic marked the visit on ' || when_label || ' as a no-show.'
      else 'Your visit on ' || when_label || ' was updated.'
    end;
  end if;

  if tg_op = 'INSERT' or new.status in ('confirmed', 'cancelled') then
    perform app_private.notify_users(
      new.clinic_id,
      app_private.clinic_role_user_ids(new.clinic_id, array['superadmin', 'admin']::public.app_role[]),
      staff_title,
      staff_message
    );
  end if;

  if dentist_user is not null then
    perform app_private.notify_users(new.clinic_id, array[dentist_user], dentist_title, dentist_message);
  end if;

  if patient_user is not null then
    perform app_private.notify_users(new.clinic_id, array[patient_user], patient_title, patient_message);
  end if;

  return new;
end;
$$;
