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
) values (
  'support_y_003',
  'support_y',
  'world',
  'byd',
  '[]'::jsonb,
  '',
  'missing',
  '',
  '',
  'Both',
  '',
  '',
  3,
  1
)
on conflict (id) do update set
  list_id = excluded.list_id,
  english_prompt = excluded.english_prompt,
  welsh_answer = excluded.welsh_answer,
  accepted_alternatives = excluded.accepted_alternatives,
  audio_url = case
    when public.words.welsh_answer = excluded.welsh_answer then public.words.audio_url
    else excluded.audio_url
  end,
  audio_status = case
    when public.words.welsh_answer = excluded.welsh_answer then public.words.audio_status
    else excluded.audio_status
  end,
  notes = excluded.notes,
  usage_note = excluded.usage_note,
  dialect = excluded.dialect,
  dialect_note = excluded.dialect_note,
  variant_group_id = excluded.variant_group_id,
  order_index = excluded.order_index,
  difficulty = excluded.difficulty;
