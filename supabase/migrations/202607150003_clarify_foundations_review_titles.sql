begin;

update public.word_lists as word_list
set
  name = review.name,
  name_cy = review.name_cy,
  description = review.description,
  description_cy = review.description_cy,
  primer_content = coalesce(word_list.primer_content, '{}'::jsonb) || jsonb_build_object(
    'titleEn', review.title_en,
    'titleCy', review.title_cy,
    'bodyEn', review.body_en,
    'bodyCy', review.body_cy
  )
from (
  values
    (
      'foundation_patterns_mixed_confidence_1_revised',
      'Review — D/DD, Y, F/FF, W, SI',
      'Adolygiad — D/DD, Y, F/FF, W, SI',
      'A short review of the D/DD, Y, F/FF, W, and SI patterns.',
      'Adolygiad byr o’r patrymau D/DD, Y, F/FF, W ac SI.',
      'Review — D/DD, Y, F/FF, W, SI',
      'Adolygiad — D/DD, Y, F/FF, W, SI',
      'This review brings together the D/DD, Y, F/FF, W, and SI patterns you’ve just practised.',
      'Mae''r adolygiad hwn yn dod â''r patrymau D/DD, Y, F/FF, W ac SI rydych chi newydd eu hymarfer ynghyd.'
    ),
    (
      'foundation_patterns_mixed_confidence_2_revised',
      'Review — CH, LL, RH, AE/AI',
      'Adolygiad — CH, LL, RH, AE/AI',
      'A short review of the CH, LL, RH, and AE/AI patterns.',
      'Adolygiad byr o’r patrymau CH, LL, RH ac AE/AI.',
      'Review — CH, LL, RH, AE/AI',
      'Adolygiad — CH, LL, RH, AE/AI',
      'This review brings together the CH, LL, RH, and AE/AI patterns you’ve just practised.',
      'Mae''r adolygiad hwn yn dod â''r patrymau CH, LL, RH ac AE/AI rydych chi newydd eu hymarfer ynghyd.'
    ),
    (
      'foundation_patterns_mixed_confidence_3_revised',
      'Review — WY, YW, OE, AU, AW',
      'Adolygiad — WY, YW, OE, AU, AW',
      'A short review of the WY, YW, OE, AU, and AW patterns.',
      'Adolygiad byr o’r patrymau WY, YW, OE, AU ac AW.',
      'Review — WY, YW, OE, AU, AW',
      'Adolygiad — WY, YW, OE, AU, AW',
      'This review brings together the WY, YW, OE, AU, and AW patterns you’ve just practised.',
      'Mae''r adolygiad hwn yn dod â''r patrymau WY, YW, OE, AU ac AW rydych chi newydd eu hymarfer ynghyd.'
    ),
    (
      'foundation_patterns_mixed_confidence_4_revised',
      'Review — U, C, G, TH/DD',
      'Adolygiad — U, C, G, TH/DD',
      'A short review of the U, C, G, and TH/DD patterns.',
      'Adolygiad byr o’r patrymau U, C, G a TH/DD.',
      'Review — U, C, G, TH/DD',
      'Adolygiad — U, C, G, TH/DD',
      'This review brings together the U, C, G, and TH/DD patterns you’ve just practised.',
      'Mae''r adolygiad hwn yn dod â''r patrymau U, C, G a TH/DD rydych chi newydd eu hymarfer ynghyd.'
    ),
    (
      'foundation_patterns_mixed_confidence_5',
      'Final Foundations Review',
      'Adolygiad Terfynol y Sylfeini',
      'A final review that brings together patterns from across Welsh Spelling Foundations.',
      'Adolygiad terfynol sy’n dod â phatrymau o bob rhan o Sylfeini Sillafu Cymraeg ynghyd.',
      'Final Foundations Review',
      'Adolygiad Terfynol y Sylfeini',
      E'This final review brings together many of the Welsh spelling patterns you''ve practised throughout Foundations.\n\nUse it as an opportunity to recognise those patterns working together in real words.',
      E'Mae''r adolygiad olaf hwn yn dod â llawer o''r patrymau sillafu Cymraeg rydych wedi''u hymarfer drwy gydol Sylfeini ynghyd.\n\nDefnyddiwch ef fel cyfle i adnabod y patrymau hynny''n gweithio gyda''i gilydd mewn geiriau go iawn.'
    )
) as review(id, name, name_cy, description, description_cy, title_en, title_cy, body_en, body_cy)
where word_list.id = review.id;

commit;
