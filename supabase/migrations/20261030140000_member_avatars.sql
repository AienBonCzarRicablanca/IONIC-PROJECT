-- Clinic members can see profile pictures of other active members in the same clinic.
-- The function returns only the avatar path, not the rest of the profile.

create or replace function public.member_avatar_paths(user_ids uuid[])
returns table (user_id uuid, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.avatar_path
  from public.profiles p
  where user_ids is not null
    and p.id = any ((user_ids)[1:200])
    and p.avatar_path is not null
    and exists (
      select 1
      from public.clinic_memberships viewer
      join public.clinic_memberships subject
        on subject.clinic_id = viewer.clinic_id
      where viewer.user_id = (select auth.uid())
        and viewer.is_active
        and subject.user_id = p.id
        and subject.is_active
    );
$$;

revoke all on function public.member_avatar_paths(uuid[]) from public, anon;
grant execute on function public.member_avatar_paths(uuid[]) to authenticated;

create policy "clinic members read member avatars"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and exists (
      select 1
      from public.clinic_memberships viewer
      join public.clinic_memberships subject
        on subject.clinic_id = viewer.clinic_id
      where viewer.user_id = (select auth.uid())
        and viewer.is_active
        and subject.is_active
        and subject.user_id = ((storage.foldername(name))[1])::uuid
    )
  );
