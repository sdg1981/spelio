alter table public.word_list_collections
  add column if not exists intro_content jsonb not null default '{}'::jsonb;

update public.word_list_collections
set intro_content = jsonb_build_object(
  'enabled', true,
  'titleEn', 'Welcome to Welsh Spelling Foundations.',
  'titleCy', 'Croeso i Sylfeini Sillafu Cymraeg.',
  'bodyEn', 'Welsh spelling follows patterns.' || E'\n\n' ||
    'Over the next few short exercises, you''ll begin to recognise some of the sounds and spelling patterns that appear throughout Welsh.' || E'\n\n' ||
    'Becoming familiar with these patterns can make Welsh spelling feel much more predictable.',
  'bodyCy', 'Mae sillafu Cymraeg yn dilyn patrymau.' || E'\n\n' ||
    'Dros yr ymarferion byr hyn, byddwch yn dechrau adnabod rhai o''r seiniau a''r patrymau sillafu sy''n ymddangos drwy''r Gymraeg.' || E'\n\n' ||
    'Gall dod yn gyfarwydd â''r patrymau hyn wneud i sillafu Cymraeg deimlo''n llawer mwy rhagweladwy.',
  'audioUrl', coalesce(intro_content->>'audioUrl', ''),
  'audioStatus', coalesce(nullif(intro_content->>'audioStatus', ''), 'missing'),
  'audioSource', coalesce(nullif(intro_content->>'audioSource', ''), 'unknown'),
  'version', coalesce(nullif(intro_content->>'version', ''), '2026-06-23'),
  'seenKey', coalesce(nullif(intro_content->>'seenKey', ''), 'spelio-collection-intro:spelio_welsh_foundations:2026-06-23')
)
where id = 'spelio_welsh_foundations'
  and (
    intro_content = '{}'::jsonb
    or intro_content->>'titleEn' is null
    or intro_content->>'bodyEn' is null
  );
