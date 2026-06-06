update public.word_list_collections
set order_index = 1
where id = 'spelio_welsh_foundations'
  and order_index is distinct from 1;

update public.word_list_collections
set order_index = 2
where id = 'spelio_core_welsh'
  and order_index is distinct from 2;
