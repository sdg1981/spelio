alter table public.words
  add column if not exists elevenlabs_extract_chunk_count integer not null default 1
    check (elevenlabs_extract_chunk_count in (1, 2, 3));
