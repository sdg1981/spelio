-- Reconcile the audited PRODUCTION baseline before Data API hardening.
--
-- Production already contains the cumulative schema and content represented by
-- the historical migrations, but its catalogue order and Meals metadata predate
-- the repository-authoritative values. It also has four redundant collection
-- policies that duplicate the committed authenticated manage/read policies.
--
-- This migration deliberately does not touch collection activation, word rows,
-- audio fields, enum ordering, custom lists, telemetry data, or storage objects.

begin;

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

drop policy if exists "authenticated users can delete collections"
  on public.word_list_collections;
drop policy if exists "authenticated users can insert collections"
  on public.word_list_collections;
drop policy if exists "authenticated users can read collections"
  on public.word_list_collections;
drop policy if exists "authenticated users can update collections"
  on public.word_list_collections;

do $$
declare
  mismatch_ids text;
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
  into mismatch_ids
  from expected
  left join public.word_lists as word_list
    on word_list.id = expected.id
    and word_list.collection_id = 'practice'
    and word_list.order_index = expected.order_index
  where word_list.id is null;

  if mismatch_ids is not null then
    raise exception 'Practice catalogue order reconciliation failed for: %', mismatch_ids;
  end if;

  if not exists (
    select 1
    from public.word_lists
    where id = 'practice_most_common_meals_and_eating'
      and collection_id = 'practice'
      and name = 'Most Common Meals & Dining'
      and name_cy = 'Prydau a Bwyta Allan Mwyaf Cyffredin'
      and description = 'Practise common Welsh words for meals and dining.'
      and description_cy = 'Ymarferwch eiriau Cymraeg cyffredin am brydau bwyd a bwyta allan.'
  ) then
    raise exception 'Meals & Dining metadata reconciliation failed';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'word_list_collections'
      and policyname in (
        'authenticated users can delete collections',
        'authenticated users can insert collections',
        'authenticated users can read collections',
        'authenticated users can update collections'
      )
  ) then
    raise exception 'Redundant word_list_collections policies remain';
  end if;
end
$$;

commit;
