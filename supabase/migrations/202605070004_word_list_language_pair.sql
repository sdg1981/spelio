alter table public.word_lists
  add column if not exists source_language text not null default 'en',
  add column if not exists target_language text not null default 'cy';

update public.word_lists
set
  source_language = coalesce(nullif(source_language, ''), 'en'),
  target_language = coalesce(nullif(target_language, ''), 'cy');
