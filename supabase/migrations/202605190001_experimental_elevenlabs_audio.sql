create type public.elevenlabs_audio_status as enum ('missing', 'pending', 'generated', 'failed');

alter table public.words
  add column if not exists elevenlabs_audio_url text not null default '',
  add column if not exists elevenlabs_audio_status public.elevenlabs_audio_status not null default 'missing';

create index if not exists words_elevenlabs_audio_status_idx
  on public.words(elevenlabs_audio_status);

insert into public.admin_settings (key, value) values
  ('default_audio_provider', '{"provider":"azure"}'::jsonb),
  ('elevenlabs_default_voice', '{"voiceId":"DikmR0aoFXAp1A3NcovW","voiceName":"Sam - Soft, Slightly Welsh and Friendly"}'::jsonb)
on conflict (key) do nothing;

create policy "public can read default audio provider"
on public.admin_settings for select
to public
using (key = 'default_audio_provider');
