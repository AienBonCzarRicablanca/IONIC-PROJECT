create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create type public.app_role as enum ('superadmin', 'admin', 'dentist', 'patient');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.queue_status as enum ('waiting', 'in_session', 'done');
create type public.dental_condition as enum ('healthy', 'decayed', 'filled', 'missing', 'crown', 'root_canal');
create type public.treatment_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'void');
create type public.payment_method as enum ('cash', 'gcash', 'card', 'bank_transfer', 'installment', 'other');
create type public.inventory_transaction_type as enum ('addition', 'consumption', 'adjustment');

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  timezone text not null default 'Asia/Manila',
  is_default boolean not null default false,
  contact_email text,
  contact_phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index clinics_single_default_idx on public.clinics(is_default) where is_default;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 160),
  role public.app_role not null default 'patient',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinic_memberships (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, user_id)
);
create index clinic_memberships_user_active_idx on public.clinic_memberships(user_id, clinic_id) where is_active;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null check (length(trim(full_name)) between 1 and 160),
  date_of_birth date,
  contact_number text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_number text,
  medical_history text,
  allergies text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, profile_id),
  unique (id, clinic_id)
);
create index patients_clinic_name_idx on public.patients(clinic_id, lower(full_name));
create index patients_clinic_email_idx on public.patients(clinic_id, lower(email)) where email is not null;

create table public.dentists (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  specialization text,
  license_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, profile_id),
  unique (id, clinic_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  duration_minutes smallint not null default 30 check (duration_minutes between 5 and 720),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, name),
  unique (id, clinic_id)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  dentist_id uuid not null,
  service_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  chair_name text,
  status public.appointment_status not null default 'pending',
  reason text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete restrict,
  foreign key (dentist_id, clinic_id) references public.dentists(id, clinic_id) on delete restrict,
  foreign key (service_id, clinic_id) references public.services(id, clinic_id) on delete restrict,
  unique (id, clinic_id),
  exclude using gist (
    clinic_id with =,
    dentist_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status not in ('cancelled', 'no_show')),
  exclude using gist (
    clinic_id with =,
    patient_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status not in ('cancelled', 'no_show')),
  exclude using gist (
    clinic_id with =,
    chair_name with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (chair_name is not null and status not in ('cancelled', 'no_show'))
);
create index appointments_clinic_start_idx on public.appointments(clinic_id, starts_at);
create index appointments_patient_start_idx on public.appointments(patient_id, starts_at desc);
create index appointments_dentist_start_idx on public.appointments(dentist_id, starts_at);

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  old_status public.appointment_status,
  new_status public.appointment_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  foreign key (appointment_id, clinic_id) references public.appointments(id, clinic_id) on delete cascade
);
create index appointment_status_history_appointment_idx on public.appointment_status_history(appointment_id, changed_at desc);

create table public.queues (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  queue_number integer not null check (queue_number > 0),
  status public.queue_status not null default 'waiting',
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (appointment_id, clinic_id) references public.appointments(id, clinic_id) on delete cascade,
  unique (clinic_id, appointment_id),
  unique (clinic_id, queue_number)
);
create index queues_clinic_status_time_idx on public.queues(clinic_id, status, added_at);

create table public.dental_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  dentist_id uuid not null,
  appointment_id uuid,
  diagnosis text not null,
  procedures_performed text,
  observations text,
  recommendations text,
  follow_up_instructions text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete restrict,
  foreign key (dentist_id, clinic_id) references public.dentists(id, clinic_id) on delete restrict,
  foreign key (appointment_id, clinic_id) references public.appointments(id, clinic_id) on delete restrict
);
create index dental_records_patient_date_idx on public.dental_records(patient_id, recorded_at desc);

create table public.odontogram_entries (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  tooth_number smallint not null check (tooth_number between 1 and 85),
  dentition text not null check (dentition in ('adult', 'primary')),
  condition public.dental_condition not null default 'healthy',
  notes text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  unique (patient_id, tooth_number),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete cascade
);
create index odontogram_clinic_patient_idx on public.odontogram_entries(clinic_id, patient_id);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  dentist_id uuid not null,
  appointment_id uuid,
  content text not null,
  is_shared_with_patient boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete restrict,
  foreign key (dentist_id, clinic_id) references public.dentists(id, clinic_id) on delete restrict,
  foreign key (appointment_id, clinic_id) references public.appointments(id, clinic_id) on delete restrict
);
create index clinical_notes_patient_date_idx on public.clinical_notes(patient_id, created_at desc);

create table public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  dentist_id uuid not null,
  title text not null,
  notes text,
  status public.treatment_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete restrict,
  foreign key (dentist_id, clinic_id) references public.dentists(id, clinic_id) on delete restrict,
  unique (id, clinic_id)
);
create index treatment_plans_patient_date_idx on public.treatment_plans(patient_id, created_at desc);

create table public.treatment_plan_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  plan_id uuid not null,
  service_id uuid references public.services(id) on delete set null,
  tooth_number smallint check (tooth_number between 1 and 85),
  description text not null,
  planned_date date,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text,
  status public.treatment_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_id, clinic_id) references public.treatment_plans(id, clinic_id) on delete cascade,
  foreign key (service_id, clinic_id) references public.services(id, clinic_id) on delete restrict
);
create index treatment_plan_items_plan_idx on public.treatment_plan_items(plan_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  appointment_id uuid,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0 and discount <= subtotal),
  total numeric(12,2) generated always as (subtotal - discount) stored,
  issued_at timestamptz,
  due_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, invoice_number),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete restrict,
  foreign key (appointment_id, clinic_id) references public.appointments(id, clinic_id) on delete restrict,
  unique (id, clinic_id)
);
create index invoices_patient_date_idx on public.invoices(patient_id, created_at desc);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid not null,
  service_id uuid,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now(),
  foreign key (invoice_id, clinic_id) references public.invoices(id, clinic_id) on delete cascade,
  foreign key (service_id, clinic_id) references public.services(id, clinic_id) on delete restrict
);
create index invoice_items_invoice_idx on public.invoice_items(invoice_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  method public.payment_method not null,
  is_confirmed boolean not null default false,
  reference_number text,
  received_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (invoice_id, clinic_id) references public.invoices(id, clinic_id) on delete restrict
);
create index payments_clinic_date_idx on public.payments(clinic_id, created_at desc);
create index payments_invoice_idx on public.payments(invoice_id);

create table public.payment_installments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid not null,
  due_at date not null,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (invoice_id, clinic_id) references public.invoices(id, clinic_id) on delete cascade
);
create index payment_installments_invoice_due_idx on public.payment_installments(invoice_id, due_at);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  category text,
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  unit text not null default 'unit',
  supplier text,
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  reorder_threshold numeric(12,3) not null default 0 check (reorder_threshold >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, name),
  unique (id, clinic_id)
);
create index inventory_low_stock_idx on public.inventory_items(clinic_id, quantity, reorder_threshold)
  where not is_archived;

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  item_id uuid not null,
  transaction_type public.inventory_transaction_type not null,
  quantity_change numeric(12,3) not null check (quantity_change <> 0),
  note text,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (item_id, clinic_id) references public.inventory_items(id, clinic_id) on delete restrict
);
create index inventory_transactions_item_date_idx on public.inventory_transactions(item_id, created_at desc);

create table public.patient_files (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (patient_id, clinic_id) references public.patients(id, clinic_id) on delete cascade
);
create index patient_files_patient_date_idx on public.patient_files(patient_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_clinic_date_idx on public.audit_logs(clinic_id, created_at desc);
create index audit_logs_actor_date_idx on public.audit_logs(actor_id, created_at desc);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function app_private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    'patient'
  );
  insert into public.clinic_memberships (clinic_id, user_id, role)
  select c.id, new.id, 'patient'
  from public.clinics c
  where c.is_default
  on conflict (clinic_id, user_id) do nothing;
  insert into public.patients (clinic_id, profile_id, full_name, email)
  select
    c.id,
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email, 'New patient'),
    new.email
  from public.clinics c
  where c.is_default
  on conflict (clinic_id, profile_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.create_profile_for_auth_user();

create or replace function app_private.has_clinic_role(
  target_clinic uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinic_memberships cm
    join public.profiles p on p.id = cm.user_id
    where cm.clinic_id = target_clinic
      and cm.user_id = (select auth.uid())
      and cm.is_active
      and p.is_active
      and cm.role = any(allowed_roles)
  );
$$;

create or replace function app_private.can_manage_profile(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinic_memberships actor
    join public.clinic_memberships target on target.clinic_id = actor.clinic_id
    join public.profiles actor_profile on actor_profile.id = actor.user_id
    join public.profiles target_profile on target_profile.id = target.user_id
    where actor.user_id = (select auth.uid())
      and target.user_id = target_user
      and actor.role = 'superadmin'
      and actor.is_active
      and target.is_active
      and actor_profile.is_active
      and target_profile.is_active
  );
$$;

create or replace function app_private.can_access_patient(target_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patients pt
    join public.clinic_memberships cm on cm.clinic_id = pt.clinic_id
    join public.profiles profile on profile.id = cm.user_id
    where pt.id = target_patient
      and cm.user_id = (select auth.uid())
      and cm.is_active
      and profile.is_active
      and (
        cm.role in ('superadmin', 'admin')
        or (cm.role = 'patient' and pt.profile_id = (select auth.uid()))
        or (
          cm.role = 'dentist'
          and exists (
            select 1
            from public.dentists d
            join public.appointments a
              on a.dentist_id = d.id
             and a.clinic_id = d.clinic_id
            where d.profile_id = (select auth.uid())
              and d.clinic_id = pt.clinic_id
              and a.patient_id = pt.id
              and a.status not in ('cancelled', 'no_show')
          )
        )
      )
  );
$$;

create or replace function app_private.can_access_patient_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  patient_folder text;
begin
  patient_folder := (storage.foldername(object_name))[1];
  if patient_folder is null or patient_folder !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;
  return app_private.can_access_patient(patient_folder::uuid);
end;
$$;

create or replace function app_private.can_manage_patient_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  patient_folder text;
  patient_clinic uuid;
begin
  patient_folder := (storage.foldername(object_name))[1];
  if patient_folder is null or patient_folder !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;

  select p.clinic_id into patient_clinic
  from public.patients p
  where p.id = patient_folder::uuid;

  if patient_clinic is null or not app_private.can_access_patient(patient_folder::uuid) then
    return false;
  end if;

  return app_private.has_clinic_role(patient_clinic, array['superadmin', 'admin', 'dentist']::public.app_role[]);
end;
$$;

create or replace function app_private.apply_inventory_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  adjustment numeric(12,3);
begin
  adjustment := new.quantity_change;
  if new.transaction_type = 'addition' and adjustment <= 0 then
    raise exception 'Addition quantity must be positive';
  elsif new.transaction_type = 'consumption' and adjustment >= 0 then
    raise exception 'Consumption quantity must be negative';
  end if;

  update public.inventory_items
  set quantity = quantity + adjustment,
      updated_at = now()
  where id = new.item_id
    and clinic_id = new.clinic_id
    and quantity + adjustment >= 0;

  if not found then
    raise exception 'Inventory item is missing or the resulting stock would be negative';
  end if;

  return new;
end;
$$;

create or replace function app_private.validate_confirmed_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice_total numeric(12,2);
  already_confirmed numeric(12,2);
begin
  select i.total
  into invoice_total
  from public.invoices i
  where i.id = new.invoice_id
    and i.clinic_id = new.clinic_id
    and i.status in ('issued', 'partially_paid')
  for update;

  if not found then
    raise exception 'Invoice does not exist, is not in this clinic, or is not issued';
  end if;

  if new.is_confirmed then
    select coalesce(sum(p.amount), 0)
    into already_confirmed
    from public.payments p
    where p.invoice_id = new.invoice_id
      and p.is_confirmed;

    if already_confirmed + new.amount > invoice_total then
      raise exception 'Confirmed payments cannot exceed the invoice balance';
    end if;
    new.confirmed_at := now();
  else
    new.confirmed_at := null;
  end if;

  return new;
end;
$$;

create or replace function app_private.guard_invoice_item_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_invoice uuid;
begin
  target_invoice := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;

  if tg_op = 'UPDATE' and old.invoice_id <> new.invoice_id then
    raise exception 'Invoice items cannot be moved between invoices';
  end if;

  if not exists (
    select 1 from public.invoices i
    where i.id = target_invoice and i.status = 'draft'
  ) then
    raise exception 'Invoice items can only be changed while the invoice is a draft';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger guard_invoice_items
  before insert or update or delete on public.invoice_items
  for each row execute function app_private.guard_invoice_item_changes();

create or replace function app_private.recalculate_invoice_subtotal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_invoice uuid;
  new_subtotal numeric(12,2);
  confirmed_amount numeric(12,2);
begin
  target_invoice := case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;

  select coalesce(sum(ii.line_total), 0)
  into new_subtotal
  from public.invoice_items ii
  where ii.invoice_id = target_invoice;

  select coalesce(sum(p.amount), 0)
  into confirmed_amount
  from public.payments p
  where p.invoice_id = target_invoice and p.is_confirmed;

  if confirmed_amount > new_subtotal then
    raise exception 'Invoice total cannot be reduced below confirmed payments';
  end if;

  update public.invoices i
  set subtotal = new_subtotal
  where i.id = target_invoice;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger recalculate_invoice_total
  after insert or update or delete on public.invoice_items
  for each row execute function app_private.recalculate_invoice_subtotal();

create or replace function app_private.protect_invoice_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed_amount numeric(12,2);
begin
  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status
      and old.status in ('paid', 'void') then
      raise exception 'Paid and void invoices cannot be reopened or changed';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'draft' and new.status in ('issued', 'void'))
      or (old.status = 'issued' and new.status in ('partially_paid', 'paid', 'void'))
      or (old.status = 'partially_paid' and new.status = 'paid')
    ) then
      raise exception 'Invalid invoice status transition';
    end if;
    if new.discount is distinct from old.discount and old.status <> 'draft' then
      raise exception 'Invoice discounts can only be changed while the invoice is a draft';
    end if;
    if new.status is not distinct from old.status
      and new.discount is not distinct from old.discount
      and new.subtotal is not distinct from old.subtotal then
      return new;
    end if;
  end if;

  if tg_op = 'INSERT' and new.status is null then
    raise exception 'Invoice status is required';
  end if;

  select coalesce(sum(p.amount), 0)
  into confirmed_amount
  from public.payments p
  where p.invoice_id = new.id and p.is_confirmed;

  if confirmed_amount > (new.subtotal - new.discount) then
    raise exception 'Invoice total cannot be reduced below confirmed payments';
  end if;

  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'paid' and confirmed_amount < (new.subtotal - new.discount) then
    raise exception 'An invoice cannot be marked paid without confirmed payments for its full total';
  elsif new.status = 'partially_paid'
    and (confirmed_amount <= 0 or confirmed_amount >= (new.subtotal - new.discount)) then
    raise exception 'Invoice partial-payment status must match confirmed payment records';
  elsif new.status = 'issued' and confirmed_amount > 0 then
    raise exception 'An invoice with confirmed payments cannot be returned to issued status';
  elsif new.status = 'void' and confirmed_amount > 0 then
    raise exception 'An invoice with confirmed payments cannot be voided';
  end if;

  return new;
end;
$$;

create trigger protect_invoice_status_before_update
  before insert or update of status, discount, subtotal on public.invoices
  for each row execute function app_private.protect_invoice_status();

create or replace function app_private.sync_invoice_payment_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed_amount numeric(12,2);
  invoice_total numeric(12,2);
begin
  if not new.is_confirmed then
    return new;
  end if;

  select coalesce(sum(p.amount), 0)
  into confirmed_amount
  from public.payments p
  where p.invoice_id = new.invoice_id and p.is_confirmed;

  select i.total into invoice_total
  from public.invoices i where i.id = new.invoice_id;

  update public.invoices
  set status = case
    when confirmed_amount >= invoice_total then 'paid'::public.invoice_status
    else 'partially_paid'::public.invoice_status
  end
  where id = new.invoice_id;

  return new;
end;
$$;

create trigger sync_invoice_after_payment
  after insert on public.payments
  for each row execute function app_private.sync_invoice_payment_status();

create or replace function app_private.validate_appointment_resources()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.dentists d
    where d.id = new.dentist_id
      and d.clinic_id = new.clinic_id
      and d.is_active
  ) then
    raise exception 'Selected dentist is inactive or not part of this clinic';
  end if;

  if not exists (
    select 1 from public.services s
    where s.id = new.service_id
      and s.clinic_id = new.clinic_id
      and s.is_active
  ) then
    raise exception 'Selected service is inactive or not part of this clinic';
  end if;

  return new;
end;
$$;

create trigger validate_appointment_resources_before_write
  before insert or update of dentist_id, service_id, clinic_id on public.appointments
  for each row execute function app_private.validate_appointment_resources();

create trigger validate_payment_before_insert
  before insert on public.payments
  for each row execute function app_private.validate_confirmed_payment();

create trigger inventory_transaction_apply
  before insert on public.inventory_transactions
  for each row execute function app_private.apply_inventory_transaction();

create or replace function app_private.record_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_status_history (clinic_id, appointment_id, old_status, new_status, changed_by)
    values (new.clinic_id, new.id, null, new.status, (select auth.uid()));
  elsif old.status is distinct from new.status then
    insert into public.appointment_status_history (clinic_id, appointment_id, old_status, new_status, changed_by)
    values (new.clinic_id, new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

create trigger appointment_status_history_write
  after insert or update of status on public.appointments
  for each row execute function app_private.record_appointment_status_change();

create or replace function app_private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  clinic_value uuid;
  entity_value text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  clinic_value := nullif(row_data ->> 'clinic_id', '')::uuid;
  entity_value := coalesce(row_data ->> 'id', row_data ->> 'user_id', row_data ->> 'item_id');

  insert into public.audit_logs (clinic_id, actor_id, action, entity_table, entity_id, metadata)
  values (
    clinic_value,
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    entity_value,
    jsonb_build_object('recorded_at', now())
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function app_private.log_profile_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (clinic_id, actor_id, action, entity_table, entity_id, metadata)
  select cm.clinic_id, (select auth.uid()), lower(tg_op), tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'),
    jsonb_build_object('recorded_at', now())
  from public.clinic_memberships cm
  where cm.user_id = coalesce(new.id, old.id)
  limit 1;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clinics', 'profiles', 'clinic_memberships', 'patients', 'dentists', 'services',
    'appointments', 'queues', 'odontogram_entries', 'clinical_notes', 'treatment_plans',
    'treatment_plan_items', 'invoices', 'invoice_items', 'payment_installments',
    'inventory_items', 'notifications'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function app_private.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create trigger audit_profile_changes
  after update or delete on public.profiles
  for each row execute function app_private.log_profile_change();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clinic_memberships', 'patients', 'dentists', 'services', 'appointments',
    'queues', 'dental_records', 'odontogram_entries', 'clinical_notes',
    'treatment_plans', 'treatment_plan_items', 'invoices', 'invoice_items',
    'payments', 'payment_installments', 'inventory_items', 'inventory_transactions',
    'patient_files'
  ]
  loop
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function app_private.write_audit_log()',
      table_name, table_name
    );
  end loop;
end;
$$;

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.patients enable row level security;
alter table public.dentists enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.queues enable row level security;
alter table public.dental_records enable row level security;
alter table public.odontogram_entries enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_plan_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_installments enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.patient_files enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "clinic members read clinic" on public.clinics
  for select to authenticated
  using (app_private.has_clinic_role(id, array['superadmin', 'admin', 'dentist', 'patient']::public.app_role[]));

create policy "users read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or app_private.can_manage_profile(id));
create policy "users update own name" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "members read clinic memberships" on public.clinic_memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or app_private.has_clinic_role(clinic_id, array['superadmin']::public.app_role[])
  );

create policy "authorized users read patients" on public.patients
  for select to authenticated
  using (app_private.can_access_patient(id));
create policy "staff create patients" on public.patients
  for insert to authenticated
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[])
    and (created_by is null or created_by = (select auth.uid()))
  );
create policy "staff update patients" on public.patients
  for update to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create policy "clinic staff read dentists" on public.dentists
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    or (is_active and app_private.has_clinic_role(clinic_id, array['patient']::public.app_role[]))
  );
create policy "owners manage dentists" on public.dentists
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin']::public.app_role[]));

create policy "members read services" on public.services
  for select to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist', 'patient']::public.app_role[]));
create policy "staff manage services" on public.services
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create policy "authorized users read appointments" on public.appointments
  for select to authenticated
  using (
    app_private.can_access_patient(patient_id)
    and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist', 'patient']::public.app_role[])
  );
create policy "patient or staff create appointments" on public.appointments
  for insert to authenticated
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[])
    or (
      app_private.has_clinic_role(clinic_id, array['patient']::public.app_role[])
      and exists (
        select 1 from public.patients p
        where p.id = appointments.patient_id
          and p.clinic_id = appointments.clinic_id
          and p.profile_id = (select auth.uid())
      )
      and status = 'pending'
      and created_by is null
          and chair_name is null
          and starts_at > now()
          and exists (
            select 1 from public.services s
            where s.id = appointments.service_id
              and s.clinic_id = appointments.clinic_id
              and s.is_active
              and appointments.ends_at =
                appointments.starts_at + make_interval(mins => s.duration_minutes)
          )
    )
  );
create policy "staff update appointments" on public.appointments
  for update to authenticated
  using (
    app_private.can_access_patient(patient_id)
    and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
  )
  with check (
    app_private.can_access_patient(patient_id)
    and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
  );

create policy "authorized users read appointment history" on public.appointment_status_history
  for select to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    or exists (
      select 1 from public.appointments a
      where a.id = appointment_id and app_private.can_access_patient(a.patient_id)
    )
  );

create policy "authorized users read queue" on public.queues
  for select to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    or exists (select 1 from public.appointments a where a.id = appointment_id and app_private.can_access_patient(a.patient_id))
  );
create policy "staff manage queue" on public.queues
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[]));

create policy "authorized users read dental records" on public.dental_records
  for select to authenticated
  using (app_private.can_access_patient(patient_id));
create policy "clinical staff write dental records" on public.dental_records
  for all to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  )
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  );

create policy "authorized users read odontogram" on public.odontogram_entries
  for select to authenticated
  using (app_private.can_access_patient(patient_id));
create policy "clinical staff write odontogram" on public.odontogram_entries
  for all to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  )
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  );

create policy "clinical staff read notes" on public.clinical_notes
  for select to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  );
create policy "patients read shared notes" on public.clinical_notes
  for select to authenticated
  using (
    is_shared_with_patient
    and app_private.has_clinic_role(clinic_id, array['patient']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  );
create policy "dentists manage notes" on public.clinical_notes
  for all to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  )
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  );

create policy "authorized users read treatment plans" on public.treatment_plans
  for select to authenticated
  using (app_private.can_access_patient(patient_id));
create policy "dentists manage treatment plans" on public.treatment_plans
  for all to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  )
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
  );

create policy "authorized users read plan items" on public.treatment_plan_items
  for select to authenticated
  using (
    exists (
      select 1 from public.treatment_plans tp
      where tp.id = plan_id and app_private.can_access_patient(tp.patient_id)
    )
  );
create policy "dentists manage plan items" on public.treatment_plan_items
  for all to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and exists (select 1 from public.treatment_plans tp where tp.id = plan_id and app_private.can_access_patient(tp.patient_id))
  )
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'dentist']::public.app_role[])
    and exists (select 1 from public.treatment_plans tp where tp.id = plan_id and app_private.can_access_patient(tp.patient_id))
  );

create policy "patients and staff read invoices" on public.invoices
  for select to authenticated
  using (
    app_private.can_access_patient(patient_id)
    and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'patient']::public.app_role[])
  );
create policy "staff manage invoices" on public.invoices
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create policy "patients and staff read invoice items" on public.invoice_items
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and app_private.can_access_patient(i.patient_id)
        and app_private.has_clinic_role(i.clinic_id, array['superadmin', 'admin', 'patient']::public.app_role[])
    )
  );
create policy "staff manage invoice items" on public.invoice_items
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create policy "patients and staff read payments" on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and app_private.can_access_patient(i.patient_id)
        and app_private.has_clinic_role(i.clinic_id, array['superadmin', 'admin', 'patient']::public.app_role[])
    )
  );
create policy "staff record payments" on public.payments
  for insert to authenticated
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[])
    and (received_by is null or received_by = (select auth.uid()))
  );

create policy "patients and staff read installments" on public.payment_installments
  for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and app_private.can_access_patient(i.patient_id)
        and app_private.has_clinic_role(i.clinic_id, array['superadmin', 'admin', 'patient']::public.app_role[])
    )
  );
create policy "staff manage installments" on public.payment_installments
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create policy "staff read inventory" on public.inventory_items
  for select to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[]));
create policy "front desk manage inventory" on public.inventory_items
  for all to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create policy "staff read inventory transactions" on public.inventory_transactions
  for select to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[]));
create policy "front desk create inventory transactions" on public.inventory_transactions
  for insert to authenticated
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[])
    and actor_id = (select auth.uid())
  );

create policy "authorized users read patient file metadata" on public.patient_files
  for select to authenticated
  using (app_private.can_access_patient(patient_id));
create policy "clinical staff add patient file metadata" on public.patient_files
  for insert to authenticated
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist']::public.app_role[])
    and app_private.can_access_patient(patient_id)
    and storage_path like patient_id::text || '/%'
    and uploaded_by = (select auth.uid())
  );
create policy "authorized staff delete patient file metadata" on public.patient_files
  for delete to authenticated
  using (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[])
  );

create policy "users read own notifications" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()) and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist', 'patient']::public.app_role[]));
create policy "users mark own notifications read" on public.notifications
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist', 'patient']::public.app_role[])
  )
  with check (
    user_id = (select auth.uid())
    and app_private.has_clinic_role(clinic_id, array['superadmin', 'admin', 'dentist', 'patient']::public.app_role[])
  );
create policy "staff create notifications" on public.notifications
  for insert to authenticated
  with check (
    app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[])
    and exists (
      select 1 from public.clinic_memberships target
      where target.clinic_id = notifications.clinic_id
        and target.user_id = notifications.user_id
        and target.is_active
    )
  );

create policy "owners read audit logs" on public.audit_logs
  for select to authenticated
  using (
    clinic_id is not null
    and app_private.has_clinic_role(clinic_id, array['superadmin']::public.app_role[])
  );

grant usage on schema public to authenticated;
grant usage on schema app_private to authenticated;
revoke all on type public.app_role, public.appointment_status, public.queue_status,
  public.dental_condition, public.treatment_status, public.invoice_status,
  public.payment_method, public.inventory_transaction_type from public, anon;
grant usage on type public.app_role, public.appointment_status, public.queue_status,
  public.dental_condition, public.treatment_status, public.invoice_status,
  public.payment_method, public.inventory_transaction_type to authenticated;
revoke all on
  public.clinics, public.profiles, public.clinic_memberships, public.patients,
  public.dentists, public.services, public.appointments, public.appointment_status_history,
  public.queues, public.dental_records, public.odontogram_entries, public.clinical_notes,
  public.treatment_plans, public.treatment_plan_items, public.invoices, public.invoice_items,
  public.payments, public.payment_installments, public.inventory_items,
  public.inventory_transactions, public.patient_files, public.notifications, public.audit_logs
from public, anon;
grant select, insert, update, delete on
  public.clinics, public.profiles, public.clinic_memberships, public.patients,
  public.dentists, public.services, public.appointments, public.appointment_status_history,
  public.queues, public.dental_records, public.odontogram_entries, public.clinical_notes,
  public.treatment_plans, public.treatment_plan_items, public.invoices, public.invoice_items,
  public.payments, public.payment_installments, public.inventory_items,
  public.inventory_transactions, public.patient_files, public.notifications, public.audit_logs
to authenticated;
revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke update on public.invoices from authenticated;
grant update (status, discount, issued_at, due_at) on public.invoices to authenticated;
revoke insert, update, delete on public.appointment_status_history, public.audit_logs from authenticated;
revoke update, delete on public.payments, public.inventory_transactions from authenticated;
revoke update on public.patient_files from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
grant execute on function app_private.has_clinic_role(uuid, public.app_role[]) to authenticated;
grant execute on function app_private.can_manage_profile(uuid) to authenticated;
grant execute on function app_private.can_access_patient(uuid) to authenticated;
grant execute on function app_private.can_access_patient_path(text) to authenticated;
grant execute on function app_private.can_manage_patient_path(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-files',
  'patient-files',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "authorized users read private patient files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'patient-files'
    and app_private.can_access_patient_path(name)
  );
create policy "clinical staff upload private patient files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'patient-files'
    and app_private.can_manage_patient_path(name)
  );
create policy "clinic staff delete private patient files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'patient-files'
    and app_private.can_manage_patient_path(name)
  );
