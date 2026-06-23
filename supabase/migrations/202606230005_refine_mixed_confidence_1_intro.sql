update public.word_lists
set primer_content = primer_content
  || jsonb_build_object(
    'bodyEn', 'This review brings together the D / DD, Y, F / FF, and W patterns you’ve just practised.',
    'bodyCy', 'Mae''r adolygiad hwn yn dod â''r patrymau D / DD, Y, F / FF a W rydych chi newydd eu hymarfer ynghyd.'
  )
where id = 'foundation_patterns_mixed_confidence_1_revised';
