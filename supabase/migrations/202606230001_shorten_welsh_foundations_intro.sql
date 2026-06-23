update public.word_list_collections
set intro_content = (
  coalesce(intro_content, '{}'::jsonb)
  || jsonb_build_object(
    'enabled', true,
    'titleEn', 'Welcome to Welsh Spelling Foundations.',
    'titleCy', 'Croeso i Sylfeini Sillafu Cymraeg.',
    'bodyEn', 'Welsh spelling follows patterns.' || E'\n\n' ||
      'Over the next few short exercises, you''ll begin to recognise some of the sounds and spelling patterns that appear throughout Welsh.' || E'\n\n' ||
      'Becoming familiar with these patterns can make Welsh spelling feel much more predictable.',
    'bodyCy', 'Mae sillafu Cymraeg yn dilyn patrymau.' || E'\n\n' ||
      'Dros yr ymarferion byr hyn, byddwch yn dechrau adnabod rhai o''r seiniau a''r patrymau sillafu sy''n ymddangos drwy''r Gymraeg.' || E'\n\n' ||
      'Gall dod yn gyfarwydd â''r patrymau hyn wneud i sillafu Cymraeg deimlo''n llawer mwy rhagweladwy.',
    'audioUrlEn', '',
    'audioStatusEn', 'missing',
    'audioSourceEn', 'unknown',
    'audioUrlCy', '',
    'audioStatusCy', 'missing',
    'audioSourceCy', 'unknown',
    'version', '2026-06-23',
    'seenKey', 'spelio-collection-intro:spelio_welsh_foundations:2026-06-23'
  )
)
where id = 'spelio_welsh_foundations';
