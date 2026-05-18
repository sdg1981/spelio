alter table public.word_lists
  add column if not exists list_type text not null default 'main',
  add column if not exists hidden_from_main_catalogue boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'word_lists_list_type_check'
      and conrelid = 'public.word_lists'::regclass
  ) then
    alter table public.word_lists
      add constraint word_lists_list_type_check
      check (list_type in ('main', 'support'));
  end if;
end $$;

insert into public.word_list_collections (
  id,
  slug,
  name,
  description,
  type,
  source_language,
  target_language,
  curriculum_key_stage,
  curriculum_area,
  owner_type,
  owner_id,
  order_index,
  is_active
) values (
  'spelio_support_welsh',
  'spelio-support-welsh',
  'Spelio Support Welsh',
  'Built-in contextual support lists for focused practice.',
  'spelio_core',
  'en',
  'cy',
  null,
  null,
  'spelio',
  null,
  99,
  true
) on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  source_language = excluded.source_language,
  target_language = excluded.target_language,
  curriculum_key_stage = excluded.curriculum_key_stage,
  curriculum_area = excluded.curriculum_area,
  owner_type = excluded.owner_type,
  owner_id = excluded.owner_id,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

insert into public.stages (id, name, order_index, is_active) values
  ('support', 'Support', 99, true)
on conflict (id) do update set
  name = excluded.name,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

insert into public.focus_categories (id, name, order_index, is_active) values
  ('welsh-spelling-basics', 'Welsh spelling basics', 99, true)
on conflict (id) do update set
  name = excluded.name,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

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
  hidden_from_main_catalogue
) values
  ('support_ff', 'support-ff', 'spelio_support_welsh', 'Support: ff pattern', 'Cymorth: patrwm ff', 'Focused support practice for Welsh ff.', 'Ymarfer cymorth ffocysedig ar gyfer ff Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10000, null, true, 'support', true),
  ('support_dd', 'support-dd', 'spelio_support_welsh', 'Support: dd pattern', 'Cymorth: patrwm dd', 'Focused support practice for Welsh dd.', 'Ymarfer cymorth ffocysedig ar gyfer dd Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10001, null, true, 'support', true),
  ('support_ll', 'support-ll', 'spelio_support_welsh', 'Support: ll pattern', 'Cymorth: patrwm ll', 'Focused support practice for Welsh ll.', 'Ymarfer cymorth ffocysedig ar gyfer ll Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10002, null, true, 'support', true),
  ('support_ch', 'support-ch', 'spelio_support_welsh', 'Support: ch pattern', 'Cymorth: patrwm ch', 'Focused support practice for Welsh ch.', 'Ymarfer cymorth ffocysedig ar gyfer ch Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10003, null, true, 'support', true),
  ('support_rh', 'support-rh', 'spelio_support_welsh', 'Support: rh pattern', 'Cymorth: patrwm rh', 'Focused support practice for Welsh rh.', 'Ymarfer cymorth ffocysedig ar gyfer rh Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10004, null, true, 'support', true),
  ('support_wy', 'support-wy', 'spelio_support_welsh', 'Support: w and y as vowels', 'Cymorth: w ac y fel llafariaid', 'Focused support practice for Welsh w and y vowel patterns.', 'Ymarfer cymorth ffocysedig ar gyfer patrymau llafariad w ac y.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10005, null, true, 'support', true),
  ('support_accents', 'support-accents', 'spelio_support_welsh', 'Support: accents and long vowels', 'Cymorth: acenion a llafariaid hir', 'Focused support practice for Welsh accents and long vowels.', 'Ymarfer cymorth ffocysedig ar gyfer acenion a llafariaid hir Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10006, null, true, 'support', true),
  ('support_spelling_basics_examples', 'support-spelling-basics-examples', 'spelio_support_welsh', 'Support: spelling basics examples', 'Cymorth: enghreifftiau hanfodion sillafu', 'Hidden support audio list for Welsh Spelling Basics explanatory examples.', 'Rhestr sain gymorth gudd ar gyfer enghreifftiau esboniadol Hanfodion Sillafu Cymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10007, null, true, 'support', true)
on conflict (id) do update set
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
  hidden_from_main_catalogue = excluded.hidden_from_main_catalogue;

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
  ('support_ff_001', 'support_ff', 'road', 'ffordd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_ff_002', 'support_ff', 'coffee', 'coffi', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_ff_003', 'support_ff', 'friend', 'ffrind', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_ff_004', 'support_ff', 'phone', 'ffôn', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_ff_005', 'support_ff', 'farm', 'fferm', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_ff_006', 'support_ff', 'fruit', 'ffrwyth', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_dd_001', 'support_dd', 'day', 'dydd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_dd_002', 'support_dd', 'today', 'heddiw', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_dd_003', 'support_dd', 'mountain', 'mynydd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_dd_004', 'support_dd', 'end', 'diwedd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_dd_005', 'support_dd', 'new', 'newydd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_dd_006', 'support_dd', 'will be', 'bydd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_ll_001', 'support_ll', 'place', 'lle', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_ll_002', 'support_ll', 'hand', 'llaw', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_ll_003', 'support_ll', 'book', 'llyfr', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_ll_004', 'support_ll', 'milk', 'llaeth', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_ll_005', 'support_ll', 'out', 'allan', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_ll_006', 'support_ll', 'can / able to', 'gallu', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_ch_001', 'support_ch', 'small', 'bach', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_ch_002', 'support_ch', 'six', 'chwech', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_ch_003', 'support_ch', 'health', 'iechyd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_ch_004', 'support_ch', 'high', 'uchel', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_ch_005', 'support_ch', 'to play', 'chwarae', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_ch_006', 'support_ch', 'to begin', 'dechrau', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_rh_001', 'support_rh', 'free', 'rhydd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_rh_002', 'support_rh', 'some / kind', 'rhyw', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_rh_003', 'support_rh', 'maiden', 'rhiain', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_rh_004', 'support_rh', 'must', 'rhaid', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_rh_005', 'support_rh', 'between', 'rhwng', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_rh_006', 'support_rh', 'to run', 'rhedeg', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_wy_001', 'support_wy', 'water', 'dŵr', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_wy_002', 'support_wy', 'egg', 'wy', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_wy_003', 'support_wy', 'living', 'byw', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_wy_004', 'support_wy', 'white', 'gwyn', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_wy_005', 'support_wy', 'to eat', 'bwyta', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_wy_006', 'support_wy', 'more', 'mwy', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_accents_001', 'support_accents', 'water', 'dŵr', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_accents_002', 'support_accents', 'house', 'tŷ', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_accents_003', 'support_accents', 'corn / grain', 'ŷd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_accents_004', 'support_accents', 'fire', 'tân', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_accents_005', 'support_accents', 'sound', 'sŵn', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_accents_006', 'support_accents', 'song', 'cân', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('support_spelling_basics_examples_001', 'support_spelling_basics_examples', 'apple', 'afal', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('support_spelling_basics_examples_002', 'support_spelling_basics_examples', 'old', 'hen', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('support_spelling_basics_examples_003', 'support_spelling_basics_examples', 'you', 'ti', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('support_spelling_basics_examples_004', 'support_spelling_basics_examples', 'morning', 'bore', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('support_spelling_basics_examples_005', 'support_spelling_basics_examples', 'school', 'ysgol', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('support_spelling_basics_examples_006', 'support_spelling_basics_examples', 'until', 'tan', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1)
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
