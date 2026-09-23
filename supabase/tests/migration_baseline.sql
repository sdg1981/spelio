-- Verify the cumulative historical baseline after a reset or an explicitly
-- authorized DEVELOPMENT reconciliation. This test is read-only and rolls back.
begin;

do $$
declare
  mismatch_ids text;
begin
  if not exists (
    select 1
    from public.word_list_collections
    where id = 'practice'
      and slug = 'practice'
      and name = 'Practice'
      and name_cy = 'Ymarfer'
      and description = 'Useful Welsh spelling practice organised by topic.'
      and description_cy is null
      and type = 'spelio_core'
      and source_language = 'en'
      and target_language = 'cy'
      and curriculum_key_stage is null
      and curriculum_area is null
      and owner_type = 'spelio'
      and owner_id is null
      and order_index = 3
      and is_active = false
  ) then
    raise exception 'Practice collection does not match migration 202606250001';
  end if;

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
    raise exception 'Missing or misordered Practice lists: %', mismatch_ids;
  end if;

  if not exists (
    select 1
    from public.word_lists
    where id = 'practice_most_common_people_and_family'
      and name = 'Most Common People & Family'
      and name_cy = 'Geiriau Cyffredin: Pobl a Theulu'
      and description = 'Practise common Welsh words for people and family.'
      and description_cy = 'Ymarfer geiriau Cymraeg cyffredin am bobl a theulu.'
      and icon_name = 'UserRound'
  ) then
    raise exception 'People & Family metadata is not at the reconciled baseline';
  end if;

  if (
    select count(*)
    from public.words
    where list_id = 'practice_most_common_people_and_family'
  ) <> 11 then
    raise exception 'People & Family must contain exactly 11 baseline words';
  end if;

  with expected(id, english_prompt, welsh_answer, dialect, dialect_note, variant_group_id, order_index) as (
    values
      ('practice_most_common_people_and_family_001', 'mother', 'mam', 'Both', '', '', 1),
      ('practice_most_common_people_and_family_002', 'father', 'tad', 'Both', '', '', 2),
      ('practice_most_common_people_and_family_003', 'brother', 'brawd', 'Both', '', '', 3),
      ('practice_most_common_people_and_family_004', 'sister', 'chwaer', 'Both', '', '', 4),
      ('practice_most_common_people_and_family_005', 'friend', 'ffrind', 'Both', '', '', 5),
      ('practice_most_common_people_and_family_006', 'child', 'plentyn', 'Both', '', '', 6),
      ('practice_most_common_people_and_family_007', 'family', 'teulu', 'Both', '', '', 7),
      ('practice_most_common_people_and_family_008', 'man', 'dyn', 'Both', '', '', 8),
      ('practice_most_common_people_and_family_009', 'woman', 'dynes', 'South Wales / Standard', 'North Wales commonly uses menyw.', 'woman', 9),
      ('practice_most_common_people_and_family_010', 'woman', 'menyw', 'North Wales', 'South/standard Welsh commonly uses dynes.', 'woman', 10),
      ('practice_most_common_people_and_family_011', 'baby', 'babi', 'Both', '', '', 11)
  )
  select string_agg(expected.id, ', ' order by expected.order_index)
  into mismatch_ids
  from expected
  left join public.words as word
    on word.id = expected.id
    and word.list_id = 'practice_most_common_people_and_family'
    and word.english_prompt = expected.english_prompt
    and word.welsh_answer = expected.welsh_answer
    and word.dialect = expected.dialect
    and word.dialect_note = expected.dialect_note
    and word.variant_group_id = expected.variant_group_id
    and word.order_index = expected.order_index
  where word.id is null;

  if mismatch_ids is not null then
    raise exception 'Divergent People & Family baseline words: %', mismatch_ids;
  end if;

  if exists (
    select 1
    from public.words
    where list_id like 'practice_most_common_%'
      and id <> 'practice_most_common_school_and_learning_010'
      and english_prompt <> lower(english_prompt)
  ) then
    raise exception 'A normal Practice prompt is not lowercase';
  end if;

  if not exists (
    select 1
    from public.words
    where id = 'practice_most_common_school_and_learning_010'
      and english_prompt = 'Welsh'
  ) then
    raise exception 'The intentionally capitalized Welsh prompt is missing';
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
    raise exception 'Meals & Dining metadata is not at the reconciled baseline';
  end if;

  if not exists (
    select 1
    from public.word_lists
    where id = 'foundation_patterns_si'
      and order_index = 40
      and next_list_id = 'foundation_patterns_mixed_confidence_1_revised'
      and primer_content ->> 'bodyEn' not like '%**%'
      and primer_content ->> 'bodyCy' not like '%**%'
  ) or (
    select count(*) from public.words where list_id = 'foundation_patterns_si'
  ) <> 8 then
    raise exception 'SI Foundations content is not at the final historical baseline';
  end if;

  if not exists (
    select 1 from public.words
    where id = 'foundation_patterns_si_004'
      and usage_note = 'Notice how si sounds before another vowel.'
  ) then
    raise exception 'SI usage-note markdown cleanup is missing';
  end if;

  if (
    select count(*)
    from public.word_lists
    where (id, name) in (
      ('foundation_patterns_mixed_confidence_1_revised', 'Review — D/DD, Y, F/FF, W, SI'),
      ('foundation_patterns_mixed_confidence_2_revised', 'Review — CH, LL, RH, AE/AI'),
      ('foundation_patterns_mixed_confidence_3_revised', 'Review — WY, YW, OE, AU, AW'),
      ('foundation_patterns_mixed_confidence_4_revised', 'Review — U, C, G, TH/DD'),
      ('foundation_patterns_mixed_confidence_5', 'Final Foundations Review')
    )
  ) <> 5 then
    raise exception 'Foundations review titles are not at the final historical baseline';
  end if;
end
$$;

do $$
declare
  cleanup_oid oid := 'public.cleanup_expired_custom_word_lists()'::regprocedure::oid;
  telemetry_oid oid := 'public.increment_mobile_typo_grace_counter(text,text,text,boolean)'::regprocedure::oid;
begin
  if md5((select prosrc from pg_proc where oid = cleanup_oid)) <> '3e1f673358e2422355d92e911fec9958' then
    raise exception 'Cleanup RPC body does not match migration 202606280004';
  end if;

  if md5((select prosrc from pg_proc where oid = telemetry_oid)) <> '1c560a1720fd1ce7723fa397af3304d7' then
    raise exception 'Telemetry RPC body does not match migration 202607150002';
  end if;

  if to_regclass('public.mobile_typo_grace_daily_counts') is null then
    raise exception 'Mobile typo-grace aggregate table is missing';
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.mobile_typo_grace_daily_counts'::regclass
  ) then
    raise exception 'Mobile typo-grace aggregate table must have RLS enabled';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mobile_typo_grace_daily_counts'
      and policyname = 'authenticated can read mobile typo grace aggregates'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual = 'true'
  ) then
    raise exception 'Mobile typo-grace SELECT policy is missing or divergent';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.mobile_typo_grace_daily_counts'::regclass
      and conname = 'mobile_typo_grace_daily_counts_event_name_check'
      and pg_get_constraintdef(oid) like '%mobile_adjacent_typo_corrected_backspace%'
      and pg_get_constraintdef(oid) like '%mobile_adjacent_typo_corrected_direct%'
  ) then
    raise exception 'Expanded mobile typo-grace event constraint is missing';
  end if;
end
$$;

rollback;
