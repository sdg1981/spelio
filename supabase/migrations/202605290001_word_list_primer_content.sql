alter table public.word_lists
  add column if not exists primer_content jsonb not null default '{}'::jsonb;

alter table public.word_lists
  drop constraint if exists word_lists_primer_content_object;

alter table public.word_lists
  add constraint word_lists_primer_content_object
  check (jsonb_typeof(primer_content) = 'object');
