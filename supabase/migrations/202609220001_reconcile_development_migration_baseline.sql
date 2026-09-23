-- Reconcile the historical DEVELOPMENT baseline before Data API hardening.
--
-- DEVELOPMENT received many of the migrations from 202606250005 through
-- 202608070001 outside the migration ledger. This migration deliberately
-- changes only the three repository-authoritative discrepancies that remained:
-- the missing People & Family reference list, Practice catalogue ordering, and
-- Meals & Dining display metadata. It does not change privileges or user data.

begin;

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
  primer_content,
  icon_name
) values (
  'practice_most_common_people_and_family',
  'most-common-people-and-family',
  'practice',
  'Most Common People & Family',
  'Geiriau Cyffredin: Pobl a Theulu',
  'Practise common Welsh words for people and family.',
  'Ymarfer geiriau Cymraeg cyffredin am bobl a theulu.',
  'Welsh',
  'en',
  'cy',
  'Mixed',
  'core',
  'topic-vocabulary',
  1,
  3,
  null,
  true,
  'main',
  false,
  '{
    "enabled": false,
    "titleEn": "",
    "titleCy": "",
    "bodyEn": "",
    "bodyCy": "",
    "soundItems": []
  }'::jsonb,
  'UserRound'
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
  primer_content = excluded.primer_content,
  icon_name = excluded.icon_name;

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
  ('practice_most_common_people_and_family_001', 'practice_most_common_people_and_family', 'mother', 'mam', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 1, 1),
  ('practice_most_common_people_and_family_002', 'practice_most_common_people_and_family', 'father', 'tad', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 2, 1),
  ('practice_most_common_people_and_family_003', 'practice_most_common_people_and_family', 'brother', 'brawd', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 3, 1),
  ('practice_most_common_people_and_family_004', 'practice_most_common_people_and_family', 'sister', 'chwaer', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 4, 1),
  ('practice_most_common_people_and_family_005', 'practice_most_common_people_and_family', 'friend', 'ffrind', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 5, 1),
  ('practice_most_common_people_and_family_006', 'practice_most_common_people_and_family', 'child', 'plentyn', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 6, 1),
  ('practice_most_common_people_and_family_007', 'practice_most_common_people_and_family', 'family', 'teulu', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 7, 1),
  ('practice_most_common_people_and_family_008', 'practice_most_common_people_and_family', 'man', 'dyn', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 8, 1),
  ('practice_most_common_people_and_family_009', 'practice_most_common_people_and_family', 'woman', 'dynes', '[]'::jsonb, '', 'missing', '', '', 'South Wales / Standard', 'North Wales commonly uses menyw.', 'woman', 9, 1),
  ('practice_most_common_people_and_family_010', 'practice_most_common_people_and_family', 'woman', 'menyw', '[]'::jsonb, '', 'missing', '', '', 'North Wales', 'South/standard Welsh commonly uses dynes.', 'woman', 10, 1),
  ('practice_most_common_people_and_family_011', 'practice_most_common_people_and_family', 'baby', 'babi', '[]'::jsonb, '', 'missing', '', '', 'Both', '', '', 11, 1)
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

with desired_order(id, order_index) as (
  values
    ('practice_most_common_animals', 1),
    ('practice_most_common_food_and_drink', 2),
    ('practice_most_common_people_and_family', 3),
    ('practice_most_common_home_and_household', 4),
    ('practice_most_common_places', 5),
    ('practice_most_common_travel_and_transport', 6),
    ('practice_most_common_weather', 7),
    ('practice_most_common_colours', 8),
    ('practice_most_common_clothing', 9),
    ('practice_most_common_time_and_calendar', 10),
    ('practice_most_common_work', 11),
    ('practice_most_common_school_and_learning', 12),
    ('practice_most_common_nature_and_landscape', 13),
    ('practice_most_common_shopping', 14),
    ('practice_most_common_body_parts', 15),
    ('practice_most_common_sports', 16),
    ('practice_most_common_leisure', 17),
    ('practice_most_common_numbers', 18),
    ('practice_most_common_meals_and_eating', 19),
    ('practice_most_common_around_town', 20)
)
update public.word_lists as word_list
set order_index = desired_order.order_index
from desired_order
where word_list.id = desired_order.id
  and word_list.collection_id = 'practice'
  and word_list.order_index is distinct from desired_order.order_index;

update public.word_lists
set
  name = 'Most Common Meals & Dining',
  name_cy = 'Prydau a Bwyta Allan Mwyaf Cyffredin',
  description = 'Practise common Welsh words for meals and dining.',
  description_cy = 'Ymarferwch eiriau Cymraeg cyffredin am brydau bwyd a bwyta allan.'
where id = 'practice_most_common_meals_and_eating'
  and collection_id = 'practice'
  and (
    name,
    name_cy,
    description,
    description_cy
  ) is distinct from (
    'Most Common Meals & Dining',
    'Prydau a Bwyta Allan Mwyaf Cyffredin',
    'Practise common Welsh words for meals and dining.',
    'Ymarferwch eiriau Cymraeg cyffredin am brydau bwyd a bwyta allan.'
  );

do $$
declare
  missing_list_ids text;
begin
  with expected(id, order_index) as (
    values
      ('practice_most_common_animals', 1),
      ('practice_most_common_food_and_drink', 2),
      ('practice_most_common_people_and_family', 3),
      ('practice_most_common_home_and_household', 4),
      ('practice_most_common_places', 5),
      ('practice_most_common_travel_and_transport', 6),
      ('practice_most_common_weather', 7),
      ('practice_most_common_colours', 8),
      ('practice_most_common_clothing', 9),
      ('practice_most_common_time_and_calendar', 10),
      ('practice_most_common_work', 11),
      ('practice_most_common_school_and_learning', 12),
      ('practice_most_common_nature_and_landscape', 13),
      ('practice_most_common_shopping', 14),
      ('practice_most_common_body_parts', 15),
      ('practice_most_common_sports', 16),
      ('practice_most_common_leisure', 17),
      ('practice_most_common_numbers', 18),
      ('practice_most_common_meals_and_eating', 19),
      ('practice_most_common_around_town', 20)
  )
  select string_agg(expected.id, ', ' order by expected.order_index)
  into missing_list_ids
  from expected
  left join public.word_lists as word_list
    on word_list.id = expected.id
    and word_list.collection_id = 'practice'
    and word_list.order_index = expected.order_index
  where word_list.id is null;

  if missing_list_ids is not null then
    raise exception 'Practice baseline reconciliation failed for: %', missing_list_ids;
  end if;

  if (select count(*) from public.words where list_id = 'practice_most_common_people_and_family') <> 11 then
    raise exception 'People & Family must contain exactly 11 baseline words';
  end if;

  if not exists (
    select 1
    from public.word_lists
    where id = 'practice_most_common_meals_and_eating'
      and name = 'Most Common Meals & Dining'
      and name_cy = 'Prydau a Bwyta Allan Mwyaf Cyffredin'
      and description = 'Practise common Welsh words for meals and dining.'
      and description_cy = 'Ymarferwch eiriau Cymraeg cyffredin am brydau bwyd a bwyta allan.'
  ) then
    raise exception 'Meals & Dining metadata did not reach the repository-authoritative state';
  end if;
end
$$;

commit;
