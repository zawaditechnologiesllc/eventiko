-- =============================================================================
-- Eventiko — Storage buckets
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('event-images', 'event-images', true),
  ('seller-logos', 'seller-logos', true),
  ('ticket-assets', 'ticket-assets', true),
  ('seller-documents', 'seller-documents', false)
on conflict (id) do nothing;

-- Public read for public buckets
drop policy if exists "public read event images" on storage.objects;
create policy "public read event images" on storage.objects
  for select using (bucket_id in ('event-images', 'seller-logos', 'ticket-assets'));

-- Authenticated users can upload to public asset buckets
drop policy if exists "auth upload assets" on storage.objects;
create policy "auth upload assets" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('event-images', 'seller-logos', 'ticket-assets', 'seller-documents'));

drop policy if exists "auth update own assets" on storage.objects;
create policy "auth update own assets" on storage.objects
  for update to authenticated
  using (owner = auth.uid());

drop policy if exists "auth delete own assets" on storage.objects;
create policy "auth delete own assets" on storage.objects
  for delete to authenticated
  using (owner = auth.uid());
