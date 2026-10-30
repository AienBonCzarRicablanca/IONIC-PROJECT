-- Public landing page can list active dentists and show only their current profile photo.

create or replace function public.list_public_dentists()
returns table (id uuid, full_name text, specialization text, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id,
    coalesce(nullif(trim(p.full_name), ''), 'Dentist'),
    d.specialization,
    p.avatar_path
  from public.dentists d
  join public.profiles p on p.id = d.profile_id
  where d.is_active
    and p.is_active
  order by 2;
$$;

revoke all on function public.list_public_dentists() from public, anon, authenticated;
grant execute on function public.list_public_dentists() to anon, authenticated;

-- Storage policies run as the visitor, who cannot read dentists directly.
-- This function checks the path with the owner's rights and returns only yes or no.
create or replace function public.is_public_dentist_avatar(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dentists d
    join public.profiles p on p.id = d.profile_id
    where d.is_active
      and p.is_active
      and p.avatar_path = object_name
  );
$$;

revoke all on function public.is_public_dentist_avatar(text) from public, anon, authenticated;
grant execute on function public.is_public_dentist_avatar(text) to anon, authenticated;

drop policy if exists "public reads dentist avatars" on storage.objects;
create policy "public reads dentist avatars"
  on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'profile-avatars'
    and public.is_public_dentist_avatar(name)
  );
