update public.word_lists
set primer_content = primer_content
  || jsonb_build_object(
    'bodyEn', 'This review brings together the U, C, G, and TH vs DD patterns you’ve just practised.',
    'bodyCy', 'Mae''r adolygiad hwn yn dod â''r patrymau U, C, G a TH vs DD rydych chi newydd eu hymarfer ynghyd.'
  )
where id = 'foundation_patterns_mixed_confidence_4_revised';
