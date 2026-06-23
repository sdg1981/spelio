update public.word_lists
set primer_content = primer_content
  || jsonb_build_object(
    'bodyEn', 'This final review brings together many of the Welsh spelling patterns you''ve practised throughout Foundations.' || E'\n\n' || 'Use it as an opportunity to recognise those patterns working together in real words.',
    'bodyCy', 'Mae''r adolygiad olaf hwn yn dod â llawer o''r patrymau sillafu Cymraeg rydych wedi''u hymarfer drwy gydol Sylfeini ynghyd.' || E'\n\n' || 'Defnyddiwch ef fel cyfle i adnabod y patrymau hynny''n gweithio gyda''i gilydd mewn geiriau go iawn.'
  )
where id = 'foundation_patterns_mixed_confidence_5';
