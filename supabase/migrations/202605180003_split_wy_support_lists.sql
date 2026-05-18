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
  ('support_w', 'support-w', 'spelio_support_welsh', 'Support: w as a vowel', 'Cymorth: w fel llafariad', 'Focused support practice for Welsh w as a vowel.', 'Ymarfer cymorth ffocysedig ar gyfer w fel llafariad Gymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10005, null, true, 'support', true),
  ('support_y', 'support-y', 'spelio_support_welsh', 'Support: y as a vowel', 'Cymorth: y fel llafariad', 'Focused support practice for Welsh y as a vowel.', 'Ymarfer cymorth ffocysedig ar gyfer y fel llafariad Gymraeg.', 'Welsh', 'en', 'cy', 'Both', 'support', 'welsh-spelling-basics', 1, 10006, null, true, 'support', true)
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

with support_words_seed (
  id,
  list_id,
  english_prompt,
  welsh_answer,
  order_index,
  difficulty
) as (
  values
    ('support_w_001', 'support_w', 'water', 'dŵr', 1, 1),
    ('support_w_002', 'support_w', 'valley', 'cwm', 2, 1),
    ('support_w_003', 'support_w', 'living', 'byw', 3, 1),
    ('support_w_004', 'support_w', 'table', 'bwrdd', 4, 1),
    ('support_w_005', 'support_w', 'tower', 'twr', 5, 1),
    ('support_w_006', 'support_w', 'meet', 'cwrdd', 6, 1),
    ('support_w_007', 'support_w', 'sound', 'sŵn', 7, 1),
    ('support_w_008', 'support_w', 'grandson / knows', 'ŵyr', 8, 1),
    ('support_w_009', 'support_w', 'man / husband', 'gwr', 9, 1),
    ('support_w_010', 'support_w', 'luck', 'lwc', 10, 1),
    ('support_y_001', 'support_y', 'house', 'tŷ', 1, 1),
    ('support_y_002', 'support_y', 'day', 'dydd', 2, 1),
    ('support_y_003', 'support_y', 'today', 'heddiw', 3, 1),
    ('support_y_004', 'support_y', 'mountain', 'mynydd', 4, 1),
    ('support_y_005', 'support_y', 'book', 'llyfr', 5, 1),
    ('support_y_006', 'support_y', 'school', 'ysgol', 6, 1),
    ('support_y_007', 'support_y', 'drink', 'yfed', 7, 1),
    ('support_y_008', 'support_y', 'island', 'ynys', 8, 1),
    ('support_y_009', 'support_y', 'fish', 'pysgod', 9, 1),
    ('support_y_010', 'support_y', 'weather', 'tywydd', 10, 1)
),
preserved_audio as (
  select distinct on (welsh_answer)
    welsh_answer,
    audio_url,
    audio_status
  from public.words
  where list_id in ('support_wy', 'support_accents', 'support_dd', 'support_ll', 'support_spelling_basics_examples')
    and (coalesce(audio_url, '') <> '' or audio_status = 'ready')
  order by
    welsh_answer,
    case when list_id = 'support_wy' then 0 else 1 end,
    order_index
)
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
)
select
  seed.id,
  seed.list_id,
  seed.english_prompt,
  seed.welsh_answer,
  '[]'::jsonb,
  coalesce(preserved_audio.audio_url, ''),
  coalesce(preserved_audio.audio_status, 'missing'),
  '',
  '',
  'Both',
  '',
  '',
  seed.order_index,
  seed.difficulty
from support_words_seed seed
left join preserved_audio on preserved_audio.welsh_answer = seed.welsh_answer
on conflict (id) do update set
  list_id = excluded.list_id,
  english_prompt = excluded.english_prompt,
  welsh_answer = excluded.welsh_answer,
  accepted_alternatives = excluded.accepted_alternatives,
  audio_url = case
    when coalesce(public.words.audio_url, '') = '' then excluded.audio_url
    else public.words.audio_url
  end,
  audio_status = case
    when coalesce(public.words.audio_url, '') = '' and public.words.audio_status in ('missing', 'failed') then excluded.audio_status
    else public.words.audio_status
  end,
  notes = excluded.notes,
  usage_note = excluded.usage_note,
  dialect = excluded.dialect,
  dialect_note = excluded.dialect_note,
  variant_group_id = excluded.variant_group_id,
  order_index = excluded.order_index,
  difficulty = excluded.difficulty;

update public.word_lists
set
  name = 'Deprecated: w and y as vowels',
  name_cy = 'Wedi darfod: w ac y fel llafariaid',
  description = 'Deprecated support list retained only to preserve existing generated audio metadata.',
  description_cy = 'Rhestr gymorth wedi darfod wedi’i chadw i ddiogelu metadata sain sydd eisoes wedi’i gynhyrchu.',
  is_active = false,
  list_type = 'support',
  hidden_from_main_catalogue = true
where id = 'support_wy';
