with practice_welsh_metadata (
  id,
  name_cy,
  description_cy
) as (
  values
    ('practice_most_common_animals', 'Geiriau Cyffredin: Anifeiliaid', 'Ymarfer enwau Cymraeg anifeiliaid cyffredin mewn sgwrs bob dydd.'),
    ('practice_most_common_food_and_drink', 'Geiriau Cyffredin: Bwyd a Diod', 'Ymarfer enwau Cymraeg ar gyfer bwyd a diod bob dydd.'),
    ('practice_most_common_people_and_family', 'Geiriau Cyffredin: Pobl a Theulu', 'Ymarfer geiriau Cymraeg cyffredin am bobl a theulu.'),
    ('practice_most_common_home_and_household', 'Geiriau Cyffredin: Y Cartref', 'Ymarfer geiriau Cymraeg cyffredin am y cartref a phethau bob dydd.'),
    ('practice_most_common_places', 'Geiriau Cyffredin: Lleoedd', 'Ymarfer enwau Cymraeg lleoedd cyffredin mewn sgwrs bob dydd.'),
    ('practice_most_common_travel_and_transport', 'Geiriau Cyffredin: Teithio a Thrafnidiaeth', 'Ymarfer geiriau Cymraeg cyffredin am deithio a thrafnidiaeth.'),
    ('practice_most_common_weather', 'Geiriau Cyffredin: Tywydd', 'Ymarfer geiriau Cymraeg cyffredin am y tywydd.'),
    ('practice_most_common_colours', 'Geiriau Cyffredin: Lliwiau', 'Ymarfer enwau Cymraeg lliwiau cyffredin.'),
    ('practice_most_common_clothing', 'Geiriau Cyffredin: Dillad', 'Ymarfer enwau Cymraeg dillad cyffredin.'),
    ('practice_most_common_time_and_calendar', 'Geiriau Cyffredin: Amser a''r Calendr', 'Ymarfer geiriau Cymraeg cyffredin am amser a dyddiadau.'),
    ('practice_most_common_work', 'Geiriau Cyffredin: Gwaith', 'Ymarfer geiriau Cymraeg cyffredin am waith a bywyd gwaith bob dydd.'),
    ('practice_most_common_school_and_learning', 'Geiriau Cyffredin: Ysgol a Dysgu', 'Ymarfer geiriau Cymraeg cyffredin am ysgol a dysgu bob dydd.'),
    ('practice_most_common_nature_and_landscape', 'Geiriau Cyffredin: Natur a Thirwedd', 'Ymarfer geiriau Cymraeg cyffredin am natur a thirwedd.'),
    ('practice_most_common_shopping', 'Geiriau Cyffredin: Siopa', 'Ymarfer geiriau Cymraeg cyffredin am siopa.'),
    ('practice_most_common_body_parts', 'Geiriau Cyffredin: Rhannau o''r Corff', 'Ymarfer geiriau Cymraeg cyffredin am rannau o''r corff.'),
    ('practice_most_common_sports', 'Geiriau Cyffredin: Chwaraeon', 'Ymarfer geiriau Cymraeg cyffredin am chwaraeon.'),
    ('practice_most_common_leisure', 'Geiriau Cyffredin: Hamdden', 'Ymarfer geiriau Cymraeg cyffredin am hamdden a gweithgareddau bob dydd.'),
    ('practice_most_common_numbers', 'Geiriau Cyffredin: Rhifau', 'Ymarfer geiriau Cymraeg ar gyfer rhifau cyffredin.'),
    ('practice_most_common_meals_and_eating', 'Bwyta ac Amser Bwyd Mwyaf Cyffredin', 'Ymarferwch eiriau Cymraeg cyffredin am amser bwyd a bwyta.'),
    ('practice_most_common_around_town', 'Geiriau Cyffredin: O Gwmpas y Dref', 'Ymarfer geiriau Cymraeg cyffredin am leoedd o gwmpas y dref.')
),
updated as (
  update public.word_lists
  set
    name_cy = case
      when word_lists.name_cy is null
        or btrim(word_lists.name_cy) = ''
        or lower(btrim(word_lists.name_cy)) in ('todo', 'tbc', 'placeholder')
      then practice_welsh_metadata.name_cy
      else word_lists.name_cy
    end,
    description_cy = case
      when word_lists.description_cy is null
        or btrim(word_lists.description_cy) = ''
        or lower(btrim(word_lists.description_cy)) in ('todo', 'tbc', 'placeholder')
      then practice_welsh_metadata.description_cy
      else word_lists.description_cy
    end
  from practice_welsh_metadata
  where word_lists.id = practice_welsh_metadata.id
    and word_lists.collection_id = 'practice'
  returning word_lists.id
)
select count(*) as practice_lists_with_welsh_metadata_checked
from updated;
