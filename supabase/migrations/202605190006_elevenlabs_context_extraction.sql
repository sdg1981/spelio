alter type public.elevenlabs_generation_mode add value if not exists 'direct_with_hint';
alter type public.elevenlabs_generation_mode add value if not exists 'context_extract';

alter table public.words
  add column if not exists elevenlabs_context_phrase text,
  add column if not exists elevenlabs_extract_mode text not null default 'none'
    check (elevenlabs_extract_mode in ('none', 'final_chunk')),
  add column if not exists elevenlabs_extraction_used boolean not null default false,
  add column if not exists elevenlabs_context_phrase_used text;
