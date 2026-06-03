alter table public.word_list_collections
  add column if not exists intro_content jsonb not null default '{}'::jsonb;

update public.word_list_collections
set intro_content = jsonb_build_object(
  'enabled', true,
  'titleEn', 'Welsh Spelling Foundations',
  'titleCy', '',
  'bodyEn', 'Welsh spelling can look unfamiliar at first, but it becomes much easier when you learn a few common patterns.' || E'\n\n' ||
    'In this Foundations path, you''ll practise the sounds and letter combinations that appear again and again in everyday Welsh.' || E'\n\n' ||
    'Listen carefully, notice the patterns, and take your time. The aim is not to memorise rules, but to make Welsh spelling feel more predictable.',
  'bodyCy', '',
  'audioUrl', coalesce(intro_content->>'audioUrl', ''),
  'audioStatus', coalesce(nullif(intro_content->>'audioStatus', ''), 'missing'),
  'audioSource', coalesce(nullif(intro_content->>'audioSource', ''), 'unknown'),
  'version', coalesce(nullif(intro_content->>'version', ''), '2026-06-03'),
  'seenKey', coalesce(nullif(intro_content->>'seenKey', ''), 'spelio-collection-intro:spelio_welsh_foundations:2026-06-03')
)
where id = 'spelio_welsh_foundations'
  and (
    intro_content = '{}'::jsonb
    or intro_content->>'titleEn' is null
    or intro_content->>'bodyEn' is null
  );
