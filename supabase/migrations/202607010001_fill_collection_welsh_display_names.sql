with collection_welsh_names(id, name_cy) as (
  values
    ('spelio_core_welsh', 'Spelio Craidd Cymraeg'),
    ('practice', 'Ymarfer'),
    ('spelio_support_welsh', 'Cymorth Spelio Cymraeg')
)
update public.word_list_collections
set name_cy = case
    when word_list_collections.name_cy is null
      or btrim(word_list_collections.name_cy) = ''
      or lower(btrim(word_list_collections.name_cy)) in ('todo', 'tbc', 'placeholder')
    then collection_welsh_names.name_cy
    else word_list_collections.name_cy
  end,
  source_language = case
    when word_list_collections.source_language is null
      or btrim(word_list_collections.source_language) = ''
    then 'en'
    else word_list_collections.source_language
  end,
  target_language = case
    when word_list_collections.target_language is null
      or btrim(word_list_collections.target_language) = ''
    then 'cy'
    else word_list_collections.target_language
  end
from collection_welsh_names
where word_list_collections.id = collection_welsh_names.id;
