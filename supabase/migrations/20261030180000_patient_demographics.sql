-- Sex is stored on the patient record. Age is calculated from date of birth.

alter table public.patients
  add column if not exists sex text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_sex_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_sex_check
      check (sex is null or sex in ('female', 'male', 'other'));
  end if;
end
$$;

create or replace function public.update_my_patient_details(
  p_date_of_birth date,
  p_sex text,
  p_address text,
  p_allergies text,
  p_medical_history text,
  p_emergency_contact_name text,
  p_emergency_contact_number text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_sex text := nullif(lower(trim(coalesce(p_sex, ''))), '');
  normalized_address text := nullif(trim(coalesce(p_address, '')), '');
  normalized_allergies text := nullif(trim(coalesce(p_allergies, '')), '');
  normalized_history text := nullif(trim(coalesce(p_medical_history, '')), '');
  normalized_emergency_name text := nullif(trim(coalesce(p_emergency_contact_name, '')), '');
  normalized_emergency_number text := nullif(trim(coalesce(p_emergency_contact_number, '')), '');
begin
  if current_user_id is null then
    raise exception 'You must be signed in to update your details.';
  end if;
  if normalized_sex is not null and normalized_sex not in ('female', 'male', 'other') then
    raise exception 'Sex must be female, male, or other.';
  end if;
  if p_date_of_birth is not null and p_date_of_birth > current_date then
    raise exception 'Date of birth cannot be in the future.';
  end if;
  if normalized_address is null then
    raise exception 'Address is required.';
  end if;
  if length(normalized_address) > 300 then
    raise exception 'Address must be 300 characters or fewer.';
  end if;
  if normalized_allergies is not null and length(normalized_allergies) > 2000 then
    raise exception 'Allergies must be 2000 characters or fewer.';
  end if;
  if normalized_history is not null and length(normalized_history) > 2000 then
    raise exception 'Medical history must be 2000 characters or fewer.';
  end if;
  if normalized_emergency_name is not null and length(normalized_emergency_name) > 160 then
    raise exception 'Emergency contact name must be 160 characters or fewer.';
  end if;
  if normalized_emergency_number is not null and length(normalized_emergency_number) > 40 then
    raise exception 'Emergency contact number must be 40 characters or fewer.';
  end if;

  update public.patients
  set date_of_birth = p_date_of_birth,
      sex = normalized_sex,
      address = normalized_address,
      allergies = normalized_allergies,
      medical_history = normalized_history,
      emergency_contact_name = normalized_emergency_name,
      emergency_contact_number = normalized_emergency_number,
      updated_at = now()
  where profile_id = current_user_id;

  if not found then
    raise exception 'Patient record not found.';
  end if;
end;
$$;

revoke all on function public.update_my_patient_details(date, text, text, text, text, text, text) from public, anon;
grant execute on function public.update_my_patient_details(date, text, text, text, text, text, text) to authenticated;
