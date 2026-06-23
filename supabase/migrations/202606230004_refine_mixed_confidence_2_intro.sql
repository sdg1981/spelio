update public.word_lists
set primer_content = primer_content
  || jsonb_build_object(
    'bodyEn', 'This review brings together the CH, LL, RH, and AE / AI patterns you’ve just practised.',
    'bodyCy', 'Mae''r adolygiad hwn yn dod â''r patrymau CH, LL, RH ac AE / AI rydych chi newydd eu hymarfer ynghyd.'
  )
where id = 'foundation_patterns_mixed_confidence_2_revised';
