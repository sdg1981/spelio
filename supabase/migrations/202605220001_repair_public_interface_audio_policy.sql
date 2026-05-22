drop policy if exists "public can read interface audio clips" on public.admin_settings;

create policy "public can read interface audio clips"
on public.admin_settings for select
to public
using (key = 'interface_audio_clips');
