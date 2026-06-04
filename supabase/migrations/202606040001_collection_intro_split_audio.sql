update public.word_list_collections
set intro_content = (
  (coalesce(intro_content, '{}'::jsonb) - 'audioUrl' - 'audioStatus' - 'audioSource' - 'introAudioUrl' - 'introAudioStatus' - 'introAudioSource')
  || jsonb_build_object(
    'audioUrlEn', coalesce(
      nullif(intro_content->>'audioUrlEn', ''),
      nullif(intro_content->>'audioUrl', ''),
      nullif(intro_content->>'introAudioUrl', ''),
      ''
    ),
    'audioStatusEn', coalesce(
      nullif(intro_content->>'audioStatusEn', ''),
      nullif(intro_content->>'audioStatus', ''),
      nullif(intro_content->>'introAudioStatus', ''),
      'missing'
    ),
    'audioSourceEn', coalesce(
      nullif(intro_content->>'audioSourceEn', ''),
      nullif(intro_content->>'audioSource', ''),
      nullif(intro_content->>'introAudioSource', ''),
      'unknown'
    ),
    'audioUrlCy', coalesce(nullif(intro_content->>'audioUrlCy', ''), ''),
    'audioStatusCy', coalesce(nullif(intro_content->>'audioStatusCy', ''), 'missing'),
    'audioSourceCy', coalesce(nullif(intro_content->>'audioSourceCy', ''), 'unknown')
  )
)
where intro_content is not null
  and (
    intro_content ? 'audioUrl'
    or intro_content ? 'audioStatus'
    or intro_content ? 'audioSource'
    or intro_content ? 'introAudioUrl'
    or intro_content ? 'introAudioStatus'
    or intro_content ? 'introAudioSource'
    or not (intro_content ? 'audioUrlEn')
    or not (intro_content ? 'audioStatusEn')
    or not (intro_content ? 'audioSourceEn')
    or not (intro_content ? 'audioUrlCy')
    or not (intro_content ? 'audioStatusCy')
    or not (intro_content ? 'audioSourceCy')
  );

update public.word_list_collections
set intro_content = jsonb_set(
  intro_content,
  '{bodyEn}',
  to_jsonb(replace(
    intro_content->>'bodyEn',
    'The aim is not to memorise rules',
    'The aim is not to memorise words and rules'
  ))
)
where id = 'spelio_welsh_foundations'
  and intro_content->>'bodyEn' like '%The aim is not to memorise rules%';
