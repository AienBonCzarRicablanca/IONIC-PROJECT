-- Front desk needs to see dentist names (and vice versa) when booking and viewing schedules.
create or replace function app_private.can_read_staff_profile(target_user uuid)
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
    join public.profiles target_profile on target_profile.id = target.user_id
    where actor.user_id = (select auth.uid())
      and target.user_id = target_user
      and actor.is_active
      and target.is_active
      and target_profile.is_active
      and actor.role in ('admin', 'dentist')
      and target.role in ('admin', 'dentist', 'superadmin')
  );
$$;

revoke all on function app_private.can_read_staff_profile(uuid) from public, anon;
grant execute on function app_private.can_read_staff_profile(uuid) to authenticated;

create policy "staff read staff profiles" on public.profiles
  for select to authenticated
  using (app_private.can_read_staff_profile(id));
