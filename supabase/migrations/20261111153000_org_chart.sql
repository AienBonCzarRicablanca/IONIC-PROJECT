-- Public organization chart for the About page.
-- The clinic owner can edit names, descriptions, photos, and positions.
-- Run this in the Supabase SQL editor.

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  parent_id uuid references public.org_members(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 80),
  role_title text not null default '' check (length(role_title) <= 80),
  bio text not null default '' check (length(bio) <= 280),
  photo_path text,
  pos_x numeric(5,2) not null default 50 check (pos_x between 0 and 100),
  pos_y numeric(5,2) not null default 14 check (pos_y between 0 and 100),
  anchor text check (anchor is null or anchor in ('left', 'right', 'below')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'org_members_photo_path_check'
  ) then
    alter table public.org_members
      add constraint org_members_photo_path_check
      check (
        photo_path is null
        or (
          char_length(photo_path) between 1 and 300
          and photo_path like clinic_id::text || '/%'
          and position('..' in photo_path) = 0
        )
      );
  end if;
end $$;

create index if not exists org_members_clinic_idx on public.org_members(clinic_id, pos_y, pos_x);

create or replace function app_private.org_member_is_valid()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_clinic uuid;
  walker uuid;
begin
  if new.parent_id is null then
    return new;
  end if;
  if new.parent_id = new.id then
    raise exception 'A person cannot report to themselves.';
  end if;

  select clinic_id into parent_clinic
  from public.org_members
  where id = new.parent_id;

  if parent_clinic is null or parent_clinic <> new.clinic_id then
    raise exception 'Choose a person from the same clinic.';
  end if;

  walker := new.parent_id;
  while walker is not null loop
    if walker = new.id then
      raise exception 'That reporting line would create a loop.';
    end if;
    select parent_id into walker from public.org_members where id = walker;
  end loop;

  return new;
end;
$$;

drop trigger if exists org_members_validate on public.org_members;
create trigger org_members_validate
  before insert or update on public.org_members
  for each row execute function app_private.org_member_is_valid();

drop trigger if exists org_members_set_updated_at on public.org_members;
create trigger org_members_set_updated_at
  before update on public.org_members
  for each row execute function app_private.set_updated_at();

alter table public.org_members enable row level security;

revoke all on table public.org_members from public, anon, authenticated;
grant select on table public.org_members to anon, authenticated;
grant insert, update, delete on table public.org_members to authenticated;

drop policy if exists "anyone reads the org chart" on public.org_members;
create policy "anyone reads the org chart"
  on public.org_members
  for select
  to anon, authenticated
  using (true);

drop policy if exists "owner manages the org chart" on public.org_members;
create policy "owner manages the org chart"
  on public.org_members
  for all
  to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin']::public.app_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-photos',
  'org-photos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner uploads org photos" on storage.objects;
create policy "owner uploads org photos"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-photos'
    and exists (
      select 1
      from public.clinic_memberships cm
      join public.profiles p on p.id = cm.user_id
      where cm.clinic_id::text = (storage.foldername(name))[1]
        and cm.user_id = (select auth.uid())
        and cm.is_active
        and p.is_active
        and cm.role::text = 'superadmin'
    )
  );

drop policy if exists "owner deletes org photos" on storage.objects;
create policy "owner deletes org photos"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-photos'
    and exists (
      select 1
      from public.clinic_memberships cm
      join public.profiles p on p.id = cm.user_id
      where cm.clinic_id::text = (storage.foldername(name))[1]
        and cm.user_id = (select auth.uid())
        and cm.is_active
        and p.is_active
        and cm.role::text = 'superadmin'
    )
  );

-- Starter chart for the clinic, so the About page is not empty.
-- The owner can rename, move, or remove every person.
do $$
declare
  clinic uuid;
  elena uuid := 'a11ce000-0000-4000-8000-000000000001';
  marco uuid := 'a11ce000-0000-4000-8000-000000000002';
  daniel uuid := 'a11ce000-0000-4000-8000-000000000003';
  rafael uuid := 'a11ce000-0000-4000-8000-000000000004';
  sofia uuid := 'a11ce000-0000-4000-8000-000000000005';
  liza uuid := 'a11ce000-0000-4000-8000-000000000006';
begin
  select id into clinic from public.clinics where is_default order by created_at limit 1;
  if clinic is null then
    select id into clinic from public.clinics order by created_at limit 1;
  end if;
  if clinic is null or exists (select 1 from public.org_members where clinic_id = clinic) then
    return;
  end if;

  insert into public.org_members (id, clinic_id, parent_id, full_name, role_title, bio, pos_x, pos_y, anchor)
  values
    (elena, clinic, null, 'Dr. Elena Cruz', 'Clinic Owner', 'Sets the standard of care and still sees patients herself.', 50, 14, null),
    (marco, clinic, elena, 'Marco Santos', 'Clinic Manager', 'Keeps the schedule, the team, and the day running calmly.', 22, 46, 'left'),
    (daniel, clinic, elena, 'Daniel Go', 'Front Desk Supervisor', 'Greets every arrival and keeps records within reach.', 50, 46, 'below'),
    (rafael, clinic, elena, 'Dr. Rafael Lim', 'Associate Dentist', 'Explains restorative treatment in plain language.', 78, 46, 'right'),
    (sofia, clinic, marco, 'Sofia Reyes', 'Patient Care Lead', 'Makes sure each visit starts with a clear plan.', 22, 78, 'below'),
    (liza, clinic, daniel, 'Liza Torres', 'Billing Coordinator', 'Walks patients through invoices before treatment begins.', 50, 78, 'below');
end $$;
