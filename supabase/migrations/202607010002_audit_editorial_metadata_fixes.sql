update public.words
set english_prompt = 'seeing you (informal)'
where id = 'foundations_first_phrases_010'
  and english_prompt = 'seeing you';

update public.words
set usage_note = 'Informal. Fuller form: “Mae’n ddrwg gen i”.'
where id = 'foundations_first_words_005'
  and (usage_note is null or btrim(usage_note) = '')
  and (
    accepted_alternatives is null
    or accepted_alternatives = '[]'::jsonb
  );

update public.words
set dialect_note = 'North Wales commonly uses the word llefrith'
where dialect_note = 'North Wales commonly use the word llefrith';

update public.words
set dialect_note = 'South Wales commonly uses the word llaeth'
where dialect_note = 'South Wales commonly use the word llaeth';
