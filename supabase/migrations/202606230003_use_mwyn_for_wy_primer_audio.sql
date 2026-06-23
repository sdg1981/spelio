update public.word_lists
set primer_content = jsonb_set(
  primer_content,
  '{soundItems}',
  (
    select coalesce(
      jsonb_agg(
        case
          when item->>'key' = '0-wy' or item->>'id' = '0-wy'
            then item
              || jsonb_build_object(
                'textToSpeak', 'mwyn',
                'audioUrl', '',
                'audioStatus', 'missing',
                'audioSource', 'unknown'
              )
          else item
        end
        order by ordinality
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(coalesce(primer_content->'soundItems', '[]'::jsonb)) with ordinality as sound_items(item, ordinality)
  )
)
where id = 'foundation_patterns_wy'
  and jsonb_typeof(primer_content->'soundItems') = 'array';
