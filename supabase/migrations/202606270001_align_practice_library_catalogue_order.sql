-- Align the Practice Library admin/database order with the public catalogue order.
-- Category grouping remains display metadata; list order should be readable in admin.
with desired_order(id, order_index) as (
  values
    ('practice_most_common_animals', 1),
    ('practice_most_common_food_and_drink', 2),
    ('practice_most_common_people_and_family', 3),
    ('practice_most_common_home_and_household', 4),
    ('practice_most_common_places', 5),
    ('practice_most_common_travel_and_transport', 6),
    ('practice_most_common_weather', 7),
    ('practice_most_common_colours', 8),
    ('practice_most_common_clothing', 9),
    ('practice_most_common_time_and_calendar', 10),
    ('practice_most_common_work', 11),
    ('practice_most_common_school_and_learning', 12),
    ('practice_most_common_nature_and_landscape', 13),
    ('practice_most_common_shopping', 14),
    ('practice_most_common_body_parts', 15),
    ('practice_most_common_sports', 16),
    ('practice_most_common_leisure', 17),
    ('practice_most_common_numbers', 18),
    ('practice_most_common_meals_and_eating', 19),
    ('practice_most_common_around_town', 20)
)
update public.word_lists
set order_index = desired_order.order_index
from desired_order
where word_lists.collection_id = 'practice'
  and word_lists.id = desired_order.id;
