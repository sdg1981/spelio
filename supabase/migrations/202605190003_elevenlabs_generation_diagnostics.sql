alter table public.words
  add column if not exists elevenlabs_generated_at timestamptz,
  add column if not exists elevenlabs_model text,
  add column if not exists elevenlabs_voice_id text,
  add column if not exists elevenlabs_language_override text,
  add column if not exists elevenlabs_prompt text;
