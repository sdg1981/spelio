with support_w_corrections (
  id,
  english_prompt,
  welsh_answer,
  order_index
) as (
  values
    ('support_w_008', 'smoke', 'mwg', 8),
    ('support_w_009', 'man / husband', 'gŵr', 9)
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
  id,
  'support_w',
  english_prompt,
  welsh_answer,
  '[]'::jsonb,
  '',
  'missing',
  '',
  '',
  'Both',
  '',
  '',
  order_index,
  1
from support_w_corrections
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
