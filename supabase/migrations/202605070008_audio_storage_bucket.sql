insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', true, 5242880, array['audio/mpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated can upload audio"
on storage.objects for insert
to authenticated
with check (bucket_id = 'audio');

create policy "authenticated can update audio"
on storage.objects for update
to authenticated
using (bucket_id = 'audio')
with check (bucket_id = 'audio');

create policy "public can read audio"
on storage.objects for select
to public
using (bucket_id = 'audio');
