insert into public.stages (id, name, order_index) values
  ('foundations', 'Foundations', 1),
  ('core', 'Core', 2),
  ('spelling', 'Spelling', 3),
  ('usage', 'Usage', 4),
  ('confidence', 'Confidence', 5)
on conflict (id) do update set
  name = excluded.name,
  order_index = excluded.order_index;

insert into public.focus_categories (id, name, order_index) values
  ('core-vocabulary', 'Core Vocabulary', 1),
  ('phrase', 'Phrase', 2),
  ('function-words', 'Function Words', 3),
  ('mixed', 'Mixed', 4),
  ('topic-vocabulary', 'Topic Vocabulary', 5),
  ('spelling-pattern', 'Spelling Pattern', 6),
  ('sentence', 'Sentence', 7)
on conflict (id) do update set
  name = excluded.name,
  order_index = excluded.order_index;

insert into public.dialect_options (id, label, order_index) values
  ('Both', 'Both', 1),
  ('Mixed', 'Mixed', 2),
  ('North Wales', 'North Wales', 3),
  ('South Wales / Standard', 'South Wales / Standard', 4),
  ('Standard', 'Standard', 5),
  ('Other', 'Other', 6)
on conflict (id) do update set
  label = excluded.label,
  order_index = excluded.order_index;

insert into public.admin_settings (key, value) values
  ('azure_voice_status', '{"status":"not_connected"}'::jsonb),
  ('storage_status', '{"status":"not_connected"}'::jsonb),
  ('analytics_status', '{"status":"disabled"}'::jsonb),
  ('admin_analytics_excluded', '{"enabled":true}'::jsonb)
on conflict (key) do update set
  value = excluded.value;
