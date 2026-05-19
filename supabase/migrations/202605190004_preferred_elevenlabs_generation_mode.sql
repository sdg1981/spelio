alter table public.words
  add column if not exists preferred_elevenlabs_generation_mode public.elevenlabs_generation_mode not null default 'direct';

update public.words
set preferred_elevenlabs_generation_mode = 'direct'
where preferred_elevenlabs_generation_mode is null;
