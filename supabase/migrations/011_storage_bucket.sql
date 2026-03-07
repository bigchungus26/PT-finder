-- Create public storage bucket for profile photos and transformations
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload
create policy "Authenticated users can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads');

-- Allow public reads
create policy "Public read access" on storage.objects
  for select to public
  using (bucket_id = 'uploads');

-- Allow users to update/delete their own uploads
create policy "Users can manage own uploads" on storage.objects
  for all to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
