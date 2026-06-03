update public.word_list_collections
set name = 'Welsh Spelling Foundations'
where id = 'spelio_welsh_foundations'
  and name is distinct from 'Welsh Spelling Foundations';

update public.stages
set name = 'Common Patterns'
where id = 'foundations'
  and name is distinct from 'Common Patterns';
