alter table public.words
  add column if not exists elevenlabs_pronunciation_hint text,
  add column if not exists elevenlabs_pronunciation_hint_used boolean not null default false,
  add column if not exists elevenlabs_pronunciation_hint_text text;
