update public.word_lists
set
  name = 'Most Common Meals & Dining',
  name_cy = 'Prydau a Bwyta Allan Mwyaf Cyffredin',
  description = 'Practise common Welsh words for meals and dining.',
  description_cy = 'Ymarferwch eiriau Cymraeg cyffredin am brydau bwyd a bwyta allan.'
where id = 'practice_most_common_meals_and_eating'
  and collection_id = 'practice';
