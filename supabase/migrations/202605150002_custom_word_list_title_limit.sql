alter table public.custom_word_lists
  drop constraint if exists custom_word_lists_title_length_check;

alter table public.custom_word_lists
  add constraint custom_word_lists_title_length_check
  check (char_length(title) between 1 and 80);
