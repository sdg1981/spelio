update public.stages
set name = 'Foundations'
where id = 'foundations'
  and name is distinct from 'Foundations';

update public.word_list_collections
set name = 'Welsh Spelling Foundations'
where id = 'spelio_welsh_foundations'
  and name is distinct from 'Welsh Spelling Foundations';
