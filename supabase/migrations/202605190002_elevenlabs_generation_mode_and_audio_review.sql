do $$
begin
  create type public.elevenlabs_generation_mode as enum ('direct', 'azure_transform');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audio_review_status as enum ('unchecked', 'approved', 'needs_review', 'needs_regeneration');
exception
  when duplicate_object then null;
end $$;

alter table public.words
  add column if not exists elevenlabs_generation_mode public.elevenlabs_generation_mode not null default 'direct',
  add column if not exists audio_review_status public.audio_review_status not null default 'unchecked';

create index if not exists words_audio_review_status_idx
  on public.words(audio_review_status);
