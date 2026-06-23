update public.word_lists
set primer_content = primer_content
  || jsonb_build_object(
    'bodyEn', 'This review brings together the WY, YW, OE, AU, and AW patterns you’ve just practised.',
    'bodyCy', 'Mae''r adolygiad hwn yn dod â''r patrymau WY, YW, OE, AU ac AW rydych chi newydd eu hymarfer ynghyd.'
  )
where id = 'foundation_patterns_mixed_confidence_3_revised';
