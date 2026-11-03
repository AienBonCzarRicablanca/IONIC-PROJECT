alter table public.inventory_items
  add column if not exists image_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inventory_items_image_path_check'
  ) then
    alter table public.inventory_items
      add constraint inventory_items_image_path_check
      check (
        image_path is null
        or (
          char_length(image_path) between 1 and 300
          and image_path like clinic_id::text || '/%'
          and position('..' in image_path) = 0
        )
      );
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inventory-images',
  'inventory-images',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "staff read inventory images"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'inventory-images'
    and exists (
      select 1
      from public.clinic_memberships cm
      join public.profiles p on p.id = cm.user_id
      where cm.clinic_id::text = (storage.foldername(name))[1]
        and cm.user_id = (select auth.uid())
        and cm.is_active
        and p.is_active
        and cm.role::text in ('superadmin', 'admin', 'dentist')
    )
  );

create policy "front desk upload inventory images"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inventory-images'
    and exists (
      select 1
      from public.clinic_memberships cm
      join public.profiles p on p.id = cm.user_id
      where cm.clinic_id::text = (storage.foldername(name))[1]
        and cm.user_id = (select auth.uid())
        and cm.is_active
        and p.is_active
        and cm.role::text in ('superadmin', 'admin')
    )
  );

create policy "front desk delete inventory images"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inventory-images'
    and exists (
      select 1
      from public.clinic_memberships cm
      join public.profiles p on p.id = cm.user_id
      where cm.clinic_id::text = (storage.foldername(name))[1]
        and cm.user_id = (select auth.uid())
        and cm.is_active
        and p.is_active
        and cm.role::text in ('superadmin', 'admin')
    )
  );
