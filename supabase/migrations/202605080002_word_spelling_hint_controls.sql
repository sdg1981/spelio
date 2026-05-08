alter table public.words
  add column if not exists spelling_hint_id text,
  add column if not exists disable_pattern_hints boolean not null default false;

create index if not exists words_spelling_hint_id_idx
  on public.words(spelling_hint_id)
  where spelling_hint_id is not null and spelling_hint_id <> '';
