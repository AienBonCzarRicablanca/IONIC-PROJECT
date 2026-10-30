# Supabase setup

This guide applies the version-controlled migration, creates the initial clinic owner, and explains how to verify the access-control setup.

## Before applying the migration

- Confirm that `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon/publishable key is intended for the browser; **never** use the service-role key as a `VITE_` variable.
- Run the app with `npm run dev` (`ionic serve --port 8100`). Set the Supabase **Site URL** to `http://localhost:8100` and allow `http://localhost:8100/login` and `http://localhost:8100/reset-password` as redirect URLs. Keep these origins aligned with the dev server; the Site URL is the fallback redirect.
- Back up any existing database before applying schema changes. This migration is intended for a new project and uses `CREATE TYPE` and `CREATE TABLE`, not an in-place upgrade path.
- The migration uses Supabase-managed `auth` and `storage` schemas.

## Apply the migration

Use the Supabase CLI so the migration stays tracked in the project:

```powershell
# Install the Supabase CLI using the official instructions for Windows.
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The project ref is the identifier in the Supabase project URL/dashboard, not the anon key. Review the proposed migration before confirming `db push`.

Alternatively, for a fresh project only, open `supabase/migrations/20261020160000_clinic_core.sql` and run its contents once in Supabase Dashboard → SQL Editor. This manual path does not update the CLI migration history; use the CLI for later migrations and reconcile the initial migration history before using `db push`.

### Apply later migrations

The profile editor requires `supabase/migrations/20261025230000_profile_self_service.sql`. If the Supabase CLI is linked and its migration history is reconciled, apply it with `supabase db push`. Otherwise, review and run that migration once in Supabase Dashboard → SQL Editor as the database owner. It adds contact and avatar metadata, a self-only profile update function, and a private `profile-avatars` bucket. Do not run the migration more than once.

After applying it, signed-in users of every role can edit their own name and contact number, request an email change (which may require confirmation), change their password, and upload a private JPG/PNG/WebP profile picture up to 2 MB. Patient contact/name edits are synchronized to their linked patient record. Avatar objects can only be read and managed by the owning account.

Generate schema types after applying:

```powershell
supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/types/database.types.ts
```

## Bootstrap the first clinic owner

The app intentionally does not allow public registration to choose a role. Create the first owner through a trusted Supabase SQL Editor session, not through browser code:

1. Sign up the owner's account through `/register` and confirm the email. If the account existed before this migration was applied, the bootstrap SQL below creates its missing profile row.
2. In SQL Editor, replace the example email and clinic details in the following block, then run it once:

```sql
do $$
declare
  owner_id uuid;
  new_clinic_id uuid;
  owner_email text := 'owner@example.com'; -- replace with the confirmed account email
begin
  select id into owner_id
  from auth.users
  where lower(email) = lower(owner_email)
    and email_confirmed_at is not null;

  if owner_id is null then
    raise exception 'No confirmed Auth account found for %', owner_email;
  end if;

  insert into public.profiles (id, full_name, role)
  select
    u.id,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), ''),
    'patient'
  from auth.users u
  where u.id = owner_id
  on conflict (id) do nothing;

  insert into public.clinics (name, timezone, is_default)
  values ('Your Dental Clinic', 'Asia/Manila', true)
  returning id into new_clinic_id;

  insert into public.clinic_memberships (clinic_id, user_id, role, is_active)
  values (new_clinic_id, owner_id, 'superadmin', true);

  update public.profiles
  set role = 'superadmin', is_active = true
  where id = owner_id;
end
$$;
```

The account can now sign in at `/login`. A single default clinic is supported for self-registration. New sign-ups receive the `patient` role from the database trigger and an active patient membership in that default clinic. If a patient registered before the default clinic was created, add their membership through a trusted SQL session after verifying the account.

For accounts that signed up before the clinic existed, attach confirmed patient accounts and create their patient records after the owner bootstrap:

```sql
insert into public.clinic_memberships (clinic_id, user_id, role)
select c.id, p.id, 'patient'
from public.profiles p
join auth.users u on u.id = p.id
cross join public.clinics c
where c.is_default
  and p.role = 'patient'
  and u.email_confirmed_at is not null
on conflict (clinic_id, user_id) do nothing;

insert into public.patients (clinic_id, profile_id, full_name, email)
select c.id, p.id, coalesce(nullif(trim(p.full_name), ''), u.email), u.email
from public.profiles p
join auth.users u on u.id = p.id
cross join public.clinics c
where c.is_default
  and p.role = 'patient'
  and u.email_confirmed_at is not null
on conflict (clinic_id, profile_id) do nothing;
```

To promote staff, use a trusted administrative workflow that updates **both** `profiles.role` and the matching `clinic_memberships.role`. The database authorization policies use clinic memberships. Never expose a service-role key or allow public users to update role/membership tables.

## Create admin (front desk) and dentist accounts

There is no in-app staff creation yet (planned for Sprint 7). Until then, as the owner:

1. The staff member signs up at `/register` and confirms their email (or add the user in Supabase Dashboard > Authentication > Users with "Auto Confirm User").
2. In the SQL Editor, set the email and role (`admin` or `dentist`) and run:

```sql
do $$
declare
  staff_email text := 'staff@example.com';  -- replace
  staff_role public.app_role := 'admin';    -- 'admin' or 'dentist'
  staff_id uuid;
  clinic uuid;
begin
  select id into staff_id from auth.users
  where lower(email) = lower(staff_email) and email_confirmed_at is not null;
  if staff_id is null then raise exception 'No confirmed account for %', staff_email; end if;

  select id into clinic from public.clinics where is_default;

  insert into public.clinic_memberships (clinic_id, user_id, role, is_active)
  values (clinic, staff_id, staff_role, true)
  on conflict (clinic_id, user_id) do update set role = excluded.role, is_active = true;

  update public.profiles set role = staff_role, is_active = true where id = staff_id;

  if staff_role = 'dentist' then
    insert into public.dentists (clinic_id, profile_id)
    values (clinic, staff_id)
    on conflict (clinic_id, profile_id) do update set is_active = true;
  end if;
end
$$;
```

3. Add at least one service so appointments can be booked:

```sql
insert into public.services (clinic_id, name, price, duration_minutes)
select id, v.name, v.price, v.minutes
from public.clinics c,
  (values ('Consultation', 500, 30), ('Cleaning', 1000, 45), ('Tooth extraction', 1500, 45), ('Filling', 1200, 60)) as v(name, price, minutes)
where c.is_default
on conflict (clinic_id, name) do nothing;
```

The staff member then signs in and is routed to their role's dashboard.

## What the migration protects

- RLS is enabled on every application table; policies are scoped by active clinic memberships and patient identity.
- Patients can read only their own patient-linked information; dentists need an assignment through an active appointment for clinical access.
- The `patient-files` bucket is private. File objects must be stored under `<patient-uuid>/<filename>` and are protected by Storage policies.
- Appointment overlap is rejected in PostgreSQL for the same dentist and, when specified, the same chair. Cancelled and no-show appointments do not reserve a slot.
- Inventory transactions apply atomically and cannot reduce stock below zero.
- Confirmed payments are capped at the issued invoice total. Revenue reports must sum confirmed `payments`, not invoice totals.
- Audit logs are trigger-written and cannot be directly inserted, updated, or deleted by authenticated users. Clinical/financial audit metadata records event details without copying medical note contents.
- Auth sign-ups always create a patient profile; caller-supplied role metadata is ignored.

The client-side route guard is only navigation UX. These database policies are the security boundary.

## Verification queries

Run in Supabase SQL Editor to confirm RLS is enabled:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'clinics', 'clinic_memberships', 'patients', 'dentists', 'services',
    'appointments', 'appointment_status_history', 'queues', 'dental_records',
    'odontogram_entries', 'clinical_notes', 'treatment_plans', 'treatment_plan_items',
    'invoices', 'invoice_items', 'payments', 'payment_installments', 'inventory_items',
    'inventory_transactions', 'patient_files', 'notifications', 'audit_logs'
  )
order by tablename;
```

Confirm the private bucket exists:

```sql
select id, name, public, file_size_limit
from storage.buckets
where id = 'patient-files';
```

### Verify patient row-level security

`supabase/tests/patient_rls_isolation.sql` checks patient access to records, odontograms, treatment plans, invoices and their child rows, patient-file metadata and Storage objects, clinical notes, and audit logs. It captures expected row counts as the database owner, switches to the `authenticated` role for the visibility checks, and rolls back the transaction.

Before running it:

1. Use **test accounts and test patient records only**. Do not use real patient data.
2. Find an active patient user and two patient records belonging to the same clinic. The first record must be linked to that user's profile. For example:

   ```sql
   select cm.user_id, own.id as own_patient_id, other.id as other_patient_id
   from public.clinic_memberships cm
   join public.profiles p on p.id = cm.user_id
   join public.patients own
     on own.profile_id = cm.user_id
    and own.clinic_id = cm.clinic_id
   join public.patients other
     on other.clinic_id = own.clinic_id
    and other.id <> own.id
   where cm.role = 'patient'
     and cm.is_active
     and p.is_active
   limit 10;
   ```

3. Open `supabase/tests/patient_rls_isolation.sql`, replace its three example UUIDs with the selected `user_id`, `own_patient_id`, and `other_patient_id`, then run the **entire script in one SQL Editor session as the database owner**. Do not execute it from the app.
4. Review every result. `FAIL` means the policy exposed a row that should be hidden. `INCONCLUSIVE` means the chosen fixtures do not contain enough rows to verify that data type; add synthetic test records through the app as an authorized test user and rerun. The script itself makes no persistent data changes.

This script verifies the patient role only. Repeat app/database checks with separate dentist, admin, and owner test accounts before loading any real patient data.

## Current scope and follow-up

This migration establishes the backend schema and policies; it does not implement all dashboard CRUD or payment-provider integrations. Appointment booking, billing workflows, generated receipts, and secure signed-file URL handling are built in their feature sprints. Push notifications also require a separate provider and Android setup.
