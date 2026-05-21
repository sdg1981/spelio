insert into public.admin_settings (key, value) values
  (
    'interface_audio_clips',
    '{
      "clips": [
        {
          "key": "practice_struggle_assist",
          "language": "en",
          "text": "You can replay the word, or reveal a letter if you need a little help.",
          "audioUrl": "",
          "audioStatus": "missing",
          "provider": "manual",
          "updatedAt": ""
        },
        {
          "key": "practice_struggle_assist",
          "language": "cy",
          "text": "Gallwch wrando eto, neu ddatgelu llythyren os oes angen help bach.",
          "audioUrl": "",
          "audioStatus": "missing",
          "provider": "manual",
          "updatedAt": ""
        }
      ]
    }'::jsonb
  )
on conflict (key) do nothing;

create policy "public can read interface audio clips"
on public.admin_settings for select
to public
using (key = 'interface_audio_clips');
