begin;

do $$
begin
  if not exists (
    select 1
    from public.word_lists
    where id = 'foundation_patterns_si'
  ) then
    update public.word_lists
    set order_index = order_index + 1
    where collection_id = 'spelio_welsh_foundations'
      and list_type = 'main'
      and order_index >= 40;
  end if;
end $$;

insert into public.word_lists (
  id,
  slug,
  collection_id,
  name,
  name_cy,
  description,
  description_cy,
  language,
  source_language,
  target_language,
  dialect,
  stage_id,
  focus_category_id,
  difficulty,
  order_index,
  next_list_id,
  is_active,
  list_type,
  hidden_from_main_catalogue,
  primer_content
) values (
  'foundation_patterns_si',
  'si',
  'spelio_welsh_foundations',
  'SI',
  'SI',
  'Recognise when Welsh SI often sounds like the SH in English shop.',
  'Dysgwch pryd mae SI Cymraeg yn aml yn swnio fel SH yn y gair Saesneg shop.',
  'Welsh',
  'en',
  'cy',
  'Both',
  'foundations',
  'spelling-pattern',
  1,
  40,
  'foundation_patterns_mixed_confidence_1_revised',
  true,
  'main',
  false,
  '{
    "enabled": true,
    "titleEn": "SI",
    "titleCy": "SI",
    "bodyEn": "In Welsh, **si** often sounds like the **\"sh\"** in the English word **\"shop\"**.\n\nThis is especially common when **si** is followed by another vowel, as in **siop** and **siarad**.\n\nThere are a few exceptions, but learning this pattern will help you recognise many common Welsh words.",
    "bodyCy": "Yn Gymraeg, mae **si** yn aml yn swnio fel **\"sh\"** yn y gair Saesneg **\"shop\"**.\n\nMae hyn yn arbennig o gyffredin pan fydd **si** yn cael ei ddilyn gan lafariad arall, fel yn **siop** a **siarad**.\n\nMae ambell eithriad, ond bydd dysgu''r patrwm hwn yn eich helpu i adnabod llawer o eiriau Cymraeg cyffredin.",
    "soundItems": [
      {
        "id": "0-si-before-a-vowel",
        "key": "0-si-before-a-vowel",
        "label": "SI (before a vowel)",
        "labelCy": "SI (cyn llafariad)",
        "textToSpeak": "siop",
        "audioUrl": "",
        "audioStatus": "missing",
        "audioSource": "unknown",
        "order": 1
      },
      {
        "id": "1-si-before-a-consonant",
        "key": "1-si-before-a-consonant",
        "label": "SI (before a consonant)",
        "labelCy": "SI (cyn gytsain)",
        "textToSpeak": "sinema",
        "audioUrl": "",
        "audioStatus": "missing",
        "audioSource": "unknown",
        "order": 2
      }
    ]
  }'::jsonb
) on conflict (id) do update set
  slug = excluded.slug,
  collection_id = excluded.collection_id,
  name = excluded.name,
  name_cy = excluded.name_cy,
  description = excluded.description,
  description_cy = excluded.description_cy,
  language = excluded.language,
  source_language = excluded.source_language,
  target_language = excluded.target_language,
  dialect = excluded.dialect,
  stage_id = excluded.stage_id,
  focus_category_id = excluded.focus_category_id,
  difficulty = excluded.difficulty,
  order_index = excluded.order_index,
  next_list_id = excluded.next_list_id,
  is_active = excluded.is_active,
  list_type = excluded.list_type,
  hidden_from_main_catalogue = excluded.hidden_from_main_catalogue,
  primer_content = excluded.primer_content;

update public.word_lists
set next_list_id = 'foundation_patterns_si'
where id = 'foundation_patterns_w';

update public.word_lists
set
  order_index = 41,
  description = 'Reinforce D / DD, Y, F / FF, W, and SI with a short representative recap.',
  primer_content = primer_content
    || jsonb_build_object(
      'bodyEn', 'This review brings together the D / DD, Y, F / FF, W, and SI patterns you’ve just practised.',
      'bodyCy', 'Mae''r adolygiad hwn yn dod â''r patrymau D / DD, Y, F / FF, W a SI rydych chi newydd eu hymarfer ynghyd.'
    )
where id = 'foundation_patterns_mixed_confidence_1_revised';

insert into public.words (
  id,
  list_id,
  english_prompt,
  welsh_answer,
  accepted_alternatives,
  audio_url,
  audio_status,
  notes,
  usage_note,
  dialect,
  dialect_note,
  variant_group_id,
  order_index,
  difficulty
) values
  ('foundation_patterns_si_001', 'foundation_patterns_si', 'zinc / sink', 'sinc', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('foundation_patterns_si_002', 'foundation_patterns_si', 'cinema', 'sinema', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('foundation_patterns_si_003', 'foundation_patterns_si', 'silk', 'sidan', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('foundation_patterns_si_004', 'foundation_patterns_si', 'shop', 'siop', '[]'::jsonb, '', 'missing', '', 'Notice how **si** sounds before another vowel.', 'Both', '', '', 4, 1),
  ('foundation_patterns_si_005', 'foundation_patterns_si', 'speak', 'siarad', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('foundation_patterns_si_006', 'foundation_patterns_si', 'jacket', 'siaced', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('foundation_patterns_si_007', 'foundation_patterns_si', 'shock', 'sioc', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 7, 1),
  ('foundation_patterns_si_008', 'foundation_patterns_si', 'sugar', 'siwgr', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 8, 1),
  ('foundation_patterns_mixed_confidence_1_revised_009', 'foundation_patterns_mixed_confidence_1_revised', 'shop', 'siop', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 9, 1),
  ('foundation_patterns_mixed_confidence_1_revised_010', 'foundation_patterns_mixed_confidence_1_revised', 'jacket', 'siaced', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 10, 1)
on conflict (id) do update set
  list_id = excluded.list_id,
  english_prompt = excluded.english_prompt,
  welsh_answer = excluded.welsh_answer,
  accepted_alternatives = excluded.accepted_alternatives,
  notes = excluded.notes,
  usage_note = excluded.usage_note,
  dialect = excluded.dialect,
  dialect_note = excluded.dialect_note,
  variant_group_id = excluded.variant_group_id,
  order_index = excluded.order_index,
  difficulty = excluded.difficulty;

commit;
