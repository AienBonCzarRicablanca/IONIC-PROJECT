-- Public contact form messages for the clinic inbox.
-- Visitors can submit through the function. Only clinic staff can read them.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  sender_name text not null check (length(trim(sender_name)) between 1 and 120),
  sender_email text not null check (length(sender_email) between 3 and 160),
  message text not null check (length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from public, anon, authenticated;
grant select, update on table public.contact_messages to authenticated;

drop policy if exists "staff read contact messages" on public.contact_messages;
create policy "staff read contact messages"
  on public.contact_messages
  for select to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

drop policy if exists "staff mark contact messages read" on public.contact_messages;
create policy "staff mark contact messages read"
  on public.contact_messages
  for update to authenticated
  using (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]))
  with check (app_private.has_clinic_role(clinic_id, array['superadmin', 'admin']::public.app_role[]));

create or replace function app_private.protect_contact_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sender_name is distinct from old.sender_name
    or new.sender_email is distinct from old.sender_email
    or new.message is distinct from old.message
    or new.clinic_id is distinct from old.clinic_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only the read state of a message can be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_contact_message_before_update on public.contact_messages;
create trigger protect_contact_message_before_update
  before update on public.contact_messages
  for each row execute function app_private.protect_contact_message();

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_clinic uuid;
  normalized_name text := nullif(trim(coalesce(p_name, '')), '');
  normalized_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  normalized_message text := nullif(trim(coalesce(p_message, '')), '');
begin
  if normalized_name is null or length(normalized_name) > 120 then
    raise exception 'Enter your name.';
  end if;
  if normalized_email is null
    or normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or length(normalized_email) > 160
  then
    raise exception 'Enter a valid email address.';
  end if;
  if normalized_message is null or length(normalized_message) > 2000 then
    raise exception 'Enter a message of 2000 characters or fewer.';
  end if;

  select c.id into target_clinic
  from public.clinics c
  order by c.created_at
  limit 1;

  if target_clinic is null then
    raise exception 'The clinic is not ready to receive messages.';
  end if;

  insert into public.contact_messages (clinic_id, sender_name, sender_email, message)
  values (target_clinic, normalized_name, normalized_email, normalized_message);
end;
$$;

revoke all on function public.submit_contact_message(text, text, text) from public, anon, authenticated;
grant execute on function public.submit_contact_message(text, text, text) to anon, authenticated;
