alter table public.words
  add column if not exists elevenlabs_extract_start_offset_ms integer not null default 80
    check (elevenlabs_extract_start_offset_ms in (80, 140, 220));
