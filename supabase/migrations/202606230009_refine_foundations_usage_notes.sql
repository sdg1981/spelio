update public.words
set usage_note = updates.usage_note
from (
  values
    ('foundation_patterns_y_001', 'Listen to how Y sounds at the end of this word.'),
    ('foundation_patterns_y_005', 'Listen to how Y sounds earlier in this word.'),
    ('foundation_patterns_f_ff_007', 'Notice how FF sounds like the English F.'),
    ('foundation_patterns_w_007', 'Listen to how W sounds before the vowel.')
) as updates(id, usage_note)
where public.words.id = updates.id;
