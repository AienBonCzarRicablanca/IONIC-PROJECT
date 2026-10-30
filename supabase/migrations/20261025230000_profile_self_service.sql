alter table public.profiles
  add column contact_number text check (contact_number is null or length(contact_number) <= 40),
  add column avatar_path text;

create or replace function public.update_my_profile(
  p_full_name text,
  p_contact_number text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_name text := trim(coalesce(p_full_name, ''));
  normalized_contact text := nullif(trim(coalesce(p_contact_number, '')), '');
begin
  if current_user_id is null then
    raise exception 'You must be signed in to update your profile.';
  end if;
  if length(normalized_name) not between 1 and 160 then
    raise exception 'Name must be between 1 and 160 characters.';
  end if;
  if normalized_contact is not null and length(normalized_contact) > 40 then
    raise exception 'Contact number must be 40 characters or fewer.';
  end if;

  update public.profiles
  set full_name = normalized_name,
      contact_number = normalized_contact,
      updated_at = now()
  where id = current_user_id
    and is_active;
  if not found then
    raise exception 'Active profile not found.';
  end if;

  update public.patients
  set full_name = normalized_name,
      contact_number = normalized_contact,
      updated_at = now()
  where profile_id = current_user_id;
end;
$$;

revoke all on function public.update_my_profile(text, text) from public, anon;
grant execute on function public.update_my_profile(text, text) to authenticated;
grant update (avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "users read own profile avatar"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users upload own profile avatar"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete own profile avatar"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
