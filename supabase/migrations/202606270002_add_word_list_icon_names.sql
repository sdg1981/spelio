alter table public.word_lists
  add column if not exists icon_name text;

comment on column public.word_lists.icon_name is
  'Optional Lucide React component name for public catalogue display.';

update public.word_lists
set icon_name = values.icon_name
from (
  values
    ('practice_most_common_animals', 'Dog'),
    ('practice_most_common_food_and_drink', 'Apple'),
    ('practice_most_common_people_and_family', 'UserRound'),
    ('practice_most_common_home_and_household', 'Home'),
    ('practice_most_common_places', 'MapPin'),
    ('practice_most_common_travel_and_transport', 'MapPin'),
    ('practice_most_common_weather', 'CloudSun'),
    ('practice_most_common_time_and_calendar', 'Calendar'),
    ('practice_most_common_colours', 'Palette'),
    ('practice_most_common_clothing', 'Shirt'),
    ('practice_most_common_work', 'BriefcaseBusiness'),
    ('practice_most_common_school_and_learning', 'GraduationCap'),
    ('practice_most_common_nature_and_landscape', 'Leaf'),
    ('practice_most_common_shopping', 'ShoppingBag')
) as values(id, icon_name)
where word_lists.id = values.id
  and nullif(word_lists.icon_name, '') is null;
