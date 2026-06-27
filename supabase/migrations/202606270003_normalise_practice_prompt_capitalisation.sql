-- Normalise ordinary English prompt capitalisation in newer Practice Library lists.
--
-- Audit source: data-exports/spelio_live_content_export_2026-06-27_22-16-14Z.json
-- Database schema: public.words(id, list_id, english_prompt, welsh_answer)
--
-- Scope:
-- - 202 ordinary prompts in practice_most_common_* lists are changed from Title Case
--   to lowercase.
-- - 1 proper noun prompt is intentionally skipped: Welsh.
-- - 0 ambiguous prompts were identified from the audit snapshot.
--
-- Safety:
-- - Updates are keyed by explicit word id and list id.
-- - The current english_prompt must match the audited expected value.
-- - Welsh answers are not changed.

begin;

create temporary table prompt_capitalisation_changes (
  word_id text primary key,
  list_id text not null,
  expected_english_prompt text not null,
  normalised_english_prompt text not null
) on commit drop;

insert into prompt_capitalisation_changes (word_id, list_id, expected_english_prompt, normalised_english_prompt)
values
  ('practice_most_common_animals_001', 'practice_most_common_animals', 'Dog', 'dog'),
  ('practice_most_common_animals_002', 'practice_most_common_animals', 'Cat', 'cat'),
  ('practice_most_common_animals_003', 'practice_most_common_animals', 'Horse', 'horse'),
  ('practice_most_common_animals_004', 'practice_most_common_animals', 'Cow', 'cow'),
  ('practice_most_common_animals_005', 'practice_most_common_animals', 'Pig', 'pig'),
  ('practice_most_common_animals_006', 'practice_most_common_animals', 'Chicken', 'chicken'),
  ('practice_most_common_animals_007', 'practice_most_common_animals', 'Fish', 'fish'),
  ('practice_most_common_animals_008', 'practice_most_common_animals', 'Bird', 'bird'),
  ('practice_most_common_animals_009', 'practice_most_common_animals', 'Bear', 'bear'),
  ('practice_most_common_animals_010', 'practice_most_common_animals', 'Lion', 'lion'),
  ('practice_most_common_food_and_drink_001', 'practice_most_common_food_and_drink', 'Water', 'water'),
  ('practice_most_common_food_and_drink_002', 'practice_most_common_food_and_drink', 'Tea', 'tea'),
  ('practice_most_common_food_and_drink_003', 'practice_most_common_food_and_drink', 'Coffee', 'coffee'),
  ('practice_most_common_food_and_drink_004', 'practice_most_common_food_and_drink', 'Milk', 'milk'),
  ('practice_most_common_food_and_drink_005', 'practice_most_common_food_and_drink', 'Milk', 'milk'),
  ('practice_most_common_food_and_drink_006', 'practice_most_common_food_and_drink', 'Bread', 'bread'),
  ('practice_most_common_food_and_drink_007', 'practice_most_common_food_and_drink', 'Cheese', 'cheese'),
  ('practice_most_common_food_and_drink_008', 'practice_most_common_food_and_drink', 'Butter', 'butter'),
  ('practice_most_common_food_and_drink_009', 'practice_most_common_food_and_drink', 'Meat', 'meat'),
  ('practice_most_common_food_and_drink_010', 'practice_most_common_food_and_drink', 'Chicken', 'chicken'),
  ('practice_most_common_food_and_drink_011', 'practice_most_common_food_and_drink', 'Sugar', 'sugar'),
  ('practice_most_common_places_001', 'practice_most_common_places', 'House', 'house'),
  ('practice_most_common_places_002', 'practice_most_common_places', 'Home', 'home'),
  ('practice_most_common_places_003', 'practice_most_common_places', 'School', 'school'),
  ('practice_most_common_places_004', 'practice_most_common_places', 'Shop', 'shop'),
  ('practice_most_common_places_005', 'practice_most_common_places', 'Town', 'town'),
  ('practice_most_common_places_006', 'practice_most_common_places', 'City', 'city'),
  ('practice_most_common_places_007', 'practice_most_common_places', 'Road', 'road'),
  ('practice_most_common_places_008', 'practice_most_common_places', 'Hospital', 'hospital'),
  ('practice_most_common_places_009', 'practice_most_common_places', 'Station', 'station'),
  ('practice_most_common_places_010', 'practice_most_common_places', 'Church', 'church'),
  ('practice_most_common_travel_and_transport_001', 'practice_most_common_travel_and_transport', 'Car', 'car'),
  ('practice_most_common_travel_and_transport_002', 'practice_most_common_travel_and_transport', 'Bus', 'bus'),
  ('practice_most_common_travel_and_transport_003', 'practice_most_common_travel_and_transport', 'Train', 'train'),
  ('practice_most_common_travel_and_transport_004', 'practice_most_common_travel_and_transport', 'Bicycle', 'bicycle'),
  ('practice_most_common_travel_and_transport_005', 'practice_most_common_travel_and_transport', 'Road', 'road'),
  ('practice_most_common_travel_and_transport_006', 'practice_most_common_travel_and_transport', 'Bridge', 'bridge'),
  ('practice_most_common_travel_and_transport_007', 'practice_most_common_travel_and_transport', 'Airport', 'airport'),
  ('practice_most_common_travel_and_transport_008', 'practice_most_common_travel_and_transport', 'Ticket', 'ticket'),
  ('practice_most_common_travel_and_transport_009', 'practice_most_common_travel_and_transport', 'Journey', 'journey'),
  ('practice_most_common_travel_and_transport_010', 'practice_most_common_travel_and_transport', 'Map', 'map'),
  ('practice_most_common_people_and_family_001', 'practice_most_common_people_and_family', 'Mother', 'mother'),
  ('practice_most_common_people_and_family_002', 'practice_most_common_people_and_family', 'Father', 'father'),
  ('practice_most_common_people_and_family_003', 'practice_most_common_people_and_family', 'Brother', 'brother'),
  ('practice_most_common_people_and_family_004', 'practice_most_common_people_and_family', 'Sister', 'sister'),
  ('practice_most_common_people_and_family_005', 'practice_most_common_people_and_family', 'Friend', 'friend'),
  ('practice_most_common_people_and_family_006', 'practice_most_common_people_and_family', 'Child', 'child'),
  ('practice_most_common_people_and_family_007', 'practice_most_common_people_and_family', 'Family', 'family'),
  ('practice_most_common_people_and_family_008', 'practice_most_common_people_and_family', 'Man', 'man'),
  ('practice_most_common_people_and_family_009', 'practice_most_common_people_and_family', 'Woman', 'woman'),
  ('practice_most_common_people_and_family_010', 'practice_most_common_people_and_family', 'Woman', 'woman'),
  ('practice_most_common_people_and_family_011', 'practice_most_common_people_and_family', 'Baby', 'baby'),
  ('practice_most_common_home_and_household_001', 'practice_most_common_home_and_household', 'House', 'house'),
  ('practice_most_common_home_and_household_002', 'practice_most_common_home_and_household', 'Room', 'room'),
  ('practice_most_common_home_and_household_003', 'practice_most_common_home_and_household', 'Door', 'door'),
  ('practice_most_common_home_and_household_004', 'practice_most_common_home_and_household', 'Window', 'window'),
  ('practice_most_common_home_and_household_005', 'practice_most_common_home_and_household', 'Table', 'table'),
  ('practice_most_common_home_and_household_006', 'practice_most_common_home_and_household', 'Chair', 'chair'),
  ('practice_most_common_home_and_household_007', 'practice_most_common_home_and_household', 'Bed', 'bed'),
  ('practice_most_common_home_and_household_008', 'practice_most_common_home_and_household', 'Kitchen', 'kitchen'),
  ('practice_most_common_home_and_household_009', 'practice_most_common_home_and_household', 'Bathroom', 'bathroom'),
  ('practice_most_common_home_and_household_010', 'practice_most_common_home_and_household', 'Key', 'key'),
  ('practice_most_common_weather_001', 'practice_most_common_weather', 'Weather', 'weather'),
  ('practice_most_common_weather_002', 'practice_most_common_weather', 'Rain', 'rain'),
  ('practice_most_common_weather_003', 'practice_most_common_weather', 'Sun', 'sun'),
  ('practice_most_common_weather_004', 'practice_most_common_weather', 'Wind', 'wind'),
  ('practice_most_common_weather_005', 'practice_most_common_weather', 'Snow', 'snow'),
  ('practice_most_common_weather_006', 'practice_most_common_weather', 'Cloud', 'cloud'),
  ('practice_most_common_weather_007', 'practice_most_common_weather', 'Cold', 'cold'),
  ('practice_most_common_weather_008', 'practice_most_common_weather', 'Warm', 'warm'),
  ('practice_most_common_weather_009', 'practice_most_common_weather', 'Hot', 'hot'),
  ('practice_most_common_weather_010', 'practice_most_common_weather', 'Storm', 'storm'),
  ('practice_most_common_colours_001', 'practice_most_common_colours', 'Red', 'red'),
  ('practice_most_common_colours_002', 'practice_most_common_colours', 'Blue', 'blue'),
  ('practice_most_common_colours_003', 'practice_most_common_colours', 'Green', 'green'),
  ('practice_most_common_colours_004', 'practice_most_common_colours', 'Yellow', 'yellow'),
  ('practice_most_common_colours_005', 'practice_most_common_colours', 'Black', 'black'),
  ('practice_most_common_colours_006', 'practice_most_common_colours', 'White', 'white'),
  ('practice_most_common_colours_007', 'practice_most_common_colours', 'Brown', 'brown'),
  ('practice_most_common_colours_008', 'practice_most_common_colours', 'Grey', 'grey'),
  ('practice_most_common_colours_009', 'practice_most_common_colours', 'Pink', 'pink'),
  ('practice_most_common_colours_010', 'practice_most_common_colours', 'Orange', 'orange'),
  ('practice_most_common_clothing_001', 'practice_most_common_clothing', 'Clothes', 'clothes'),
  ('practice_most_common_clothing_002', 'practice_most_common_clothing', 'Coat', 'coat'),
  ('practice_most_common_clothing_003', 'practice_most_common_clothing', 'Shoes', 'shoes'),
  ('practice_most_common_clothing_004', 'practice_most_common_clothing', 'Hat', 'hat'),
  ('practice_most_common_clothing_005', 'practice_most_common_clothing', 'Shirt', 'shirt'),
  ('practice_most_common_clothing_006', 'practice_most_common_clothing', 'Trousers', 'trousers'),
  ('practice_most_common_clothing_007', 'practice_most_common_clothing', 'Dress', 'dress'),
  ('practice_most_common_clothing_008', 'practice_most_common_clothing', 'Sock', 'sock'),
  ('practice_most_common_clothing_009', 'practice_most_common_clothing', 'Jumper', 'jumper'),
  ('practice_most_common_clothing_010', 'practice_most_common_clothing', 'Jacket', 'jacket'),
  ('practice_most_common_time_and_calendar_001', 'practice_most_common_time_and_calendar', 'Today', 'today'),
  ('practice_most_common_time_and_calendar_002', 'practice_most_common_time_and_calendar', 'Tomorrow', 'tomorrow'),
  ('practice_most_common_time_and_calendar_003', 'practice_most_common_time_and_calendar', 'Yesterday', 'yesterday'),
  ('practice_most_common_time_and_calendar_004', 'practice_most_common_time_and_calendar', 'Now', 'now'),
  ('practice_most_common_time_and_calendar_005', 'practice_most_common_time_and_calendar', 'Now', 'now'),
  ('practice_most_common_time_and_calendar_006', 'practice_most_common_time_and_calendar', 'Day', 'day'),
  ('practice_most_common_time_and_calendar_007', 'practice_most_common_time_and_calendar', 'Week', 'week'),
  ('practice_most_common_time_and_calendar_008', 'practice_most_common_time_and_calendar', 'Month', 'month'),
  ('practice_most_common_time_and_calendar_009', 'practice_most_common_time_and_calendar', 'Year', 'year'),
  ('practice_most_common_time_and_calendar_010', 'practice_most_common_time_and_calendar', 'Morning', 'morning'),
  ('practice_most_common_time_and_calendar_011', 'practice_most_common_time_and_calendar', 'Evening / night', 'evening / night'),
  ('practice_most_common_work_001', 'practice_most_common_work', 'Work', 'work'),
  ('practice_most_common_work_002', 'practice_most_common_work', 'Job', 'job'),
  ('practice_most_common_work_003', 'practice_most_common_work', 'Office', 'office'),
  ('practice_most_common_work_004', 'practice_most_common_work', 'Company', 'company'),
  ('practice_most_common_work_005', 'practice_most_common_work', 'Business', 'business'),
  ('practice_most_common_work_006', 'practice_most_common_work', 'Computer', 'computer'),
  ('practice_most_common_work_007', 'practice_most_common_work', 'Phone', 'phone'),
  ('practice_most_common_work_008', 'practice_most_common_work', 'Email', 'email'),
  ('practice_most_common_work_009', 'practice_most_common_work', 'Meeting', 'meeting'),
  ('practice_most_common_work_010', 'practice_most_common_work', 'Money', 'money'),
  ('practice_most_common_school_and_learning_001', 'practice_most_common_school_and_learning', 'School', 'school'),
  ('practice_most_common_school_and_learning_002', 'practice_most_common_school_and_learning', 'Teacher', 'teacher'),
  ('practice_most_common_school_and_learning_003', 'practice_most_common_school_and_learning', 'Student', 'student'),
  ('practice_most_common_school_and_learning_004', 'practice_most_common_school_and_learning', 'Book', 'book'),
  ('practice_most_common_school_and_learning_005', 'practice_most_common_school_and_learning', 'Pen', 'pen'),
  ('practice_most_common_school_and_learning_006', 'practice_most_common_school_and_learning', 'Pencil', 'pencil'),
  ('practice_most_common_school_and_learning_007', 'practice_most_common_school_and_learning', 'Paper', 'paper'),
  ('practice_most_common_school_and_learning_008', 'practice_most_common_school_and_learning', 'Lesson', 'lesson'),
  ('practice_most_common_school_and_learning_009', 'practice_most_common_school_and_learning', 'Learn', 'learn'),
  ('practice_most_common_nature_and_landscape_001', 'practice_most_common_nature_and_landscape', 'Tree', 'tree'),
  ('practice_most_common_nature_and_landscape_002', 'practice_most_common_nature_and_landscape', 'River', 'river'),
  ('practice_most_common_nature_and_landscape_003', 'practice_most_common_nature_and_landscape', 'Mountain', 'mountain'),
  ('practice_most_common_nature_and_landscape_004', 'practice_most_common_nature_and_landscape', 'Sea', 'sea'),
  ('practice_most_common_nature_and_landscape_005', 'practice_most_common_nature_and_landscape', 'Beach', 'beach'),
  ('practice_most_common_nature_and_landscape_006', 'practice_most_common_nature_and_landscape', 'Forest', 'forest'),
  ('practice_most_common_nature_and_landscape_007', 'practice_most_common_nature_and_landscape', 'Flower', 'flower'),
  ('practice_most_common_nature_and_landscape_008', 'practice_most_common_nature_and_landscape', 'Grass', 'grass'),
  ('practice_most_common_nature_and_landscape_009', 'practice_most_common_nature_and_landscape', 'Stone', 'stone'),
  ('practice_most_common_nature_and_landscape_010', 'practice_most_common_nature_and_landscape', 'Field', 'field'),
  ('practice_most_common_shopping_001', 'practice_most_common_shopping', 'Shop', 'shop'),
  ('practice_most_common_shopping_002', 'practice_most_common_shopping', 'Money', 'money'),
  ('practice_most_common_shopping_003', 'practice_most_common_shopping', 'Price', 'price'),
  ('practice_most_common_shopping_004', 'practice_most_common_shopping', 'Customer', 'customer'),
  ('practice_most_common_shopping_005', 'practice_most_common_shopping', 'Card', 'card'),
  ('practice_most_common_shopping_006', 'practice_most_common_shopping', 'Bag', 'bag'),
  ('practice_most_common_shopping_007', 'practice_most_common_shopping', 'Receipt', 'receipt'),
  ('practice_most_common_shopping_008', 'practice_most_common_shopping', 'Market', 'market'),
  ('practice_most_common_shopping_009', 'practice_most_common_shopping', 'Buy', 'buy'),
  ('practice_most_common_shopping_010', 'practice_most_common_shopping', 'Sell', 'sell'),
  ('practice_most_common_body_parts_001', 'practice_most_common_body_parts', 'Head', 'head'),
  ('practice_most_common_body_parts_002', 'practice_most_common_body_parts', 'Hand', 'hand'),
  ('practice_most_common_body_parts_003', 'practice_most_common_body_parts', 'Foot', 'foot'),
  ('practice_most_common_body_parts_004', 'practice_most_common_body_parts', 'Eye', 'eye'),
  ('practice_most_common_body_parts_005', 'practice_most_common_body_parts', 'Ear', 'ear'),
  ('practice_most_common_body_parts_006', 'practice_most_common_body_parts', 'Mouth', 'mouth'),
  ('practice_most_common_body_parts_007', 'practice_most_common_body_parts', 'Nose', 'nose'),
  ('practice_most_common_body_parts_008', 'practice_most_common_body_parts', 'Arm', 'arm'),
  ('practice_most_common_body_parts_009', 'practice_most_common_body_parts', 'Leg', 'leg'),
  ('practice_most_common_body_parts_010', 'practice_most_common_body_parts', 'Heart', 'heart'),
  ('practice_most_common_sports_001', 'practice_most_common_sports', 'Football', 'football'),
  ('practice_most_common_sports_002', 'practice_most_common_sports', 'Rugby', 'rugby'),
  ('practice_most_common_sports_003', 'practice_most_common_sports', 'Swimming', 'swimming'),
  ('practice_most_common_sports_004', 'practice_most_common_sports', 'Running', 'running'),
  ('practice_most_common_sports_005', 'practice_most_common_sports', 'Walking', 'walking'),
  ('practice_most_common_sports_006', 'practice_most_common_sports', 'Tennis', 'tennis'),
  ('practice_most_common_sports_007', 'practice_most_common_sports', 'Cricket', 'cricket'),
  ('practice_most_common_sports_008', 'practice_most_common_sports', 'Golf', 'golf'),
  ('practice_most_common_sports_009', 'practice_most_common_sports', 'Cycling', 'cycling'),
  ('practice_most_common_sports_010', 'practice_most_common_sports', 'Sport', 'sport'),
  ('practice_most_common_leisure_001', 'practice_most_common_leisure', 'Music', 'music'),
  ('practice_most_common_leisure_002', 'practice_most_common_leisure', 'Book', 'book'),
  ('practice_most_common_leisure_003', 'practice_most_common_leisure', 'Film', 'film'),
  ('practice_most_common_leisure_004', 'practice_most_common_leisure', 'Television', 'television'),
  ('practice_most_common_leisure_005', 'practice_most_common_leisure', 'Holiday', 'holiday'),
  ('practice_most_common_leisure_006', 'practice_most_common_leisure', 'Game', 'game'),
  ('practice_most_common_leisure_007', 'practice_most_common_leisure', 'Reading', 'reading'),
  ('practice_most_common_leisure_008', 'practice_most_common_leisure', 'Singing', 'singing'),
  ('practice_most_common_leisure_009', 'practice_most_common_leisure', 'Dancing', 'dancing'),
  ('practice_most_common_leisure_010', 'practice_most_common_leisure', 'Walking', 'walking'),
  ('practice_most_common_numbers_001', 'practice_most_common_numbers', 'One', 'one'),
  ('practice_most_common_numbers_002', 'practice_most_common_numbers', 'Two', 'two'),
  ('practice_most_common_numbers_003', 'practice_most_common_numbers', 'Three', 'three'),
  ('practice_most_common_numbers_004', 'practice_most_common_numbers', 'Four', 'four'),
  ('practice_most_common_numbers_005', 'practice_most_common_numbers', 'Five', 'five'),
  ('practice_most_common_numbers_006', 'practice_most_common_numbers', 'Six', 'six'),
  ('practice_most_common_numbers_007', 'practice_most_common_numbers', 'Seven', 'seven'),
  ('practice_most_common_numbers_008', 'practice_most_common_numbers', 'Eight', 'eight'),
  ('practice_most_common_numbers_009', 'practice_most_common_numbers', 'Nine', 'nine'),
  ('practice_most_common_numbers_010', 'practice_most_common_numbers', 'Ten', 'ten'),
  ('practice_most_common_meals_and_eating_001', 'practice_most_common_meals_and_eating', 'Breakfast', 'breakfast'),
  ('practice_most_common_meals_and_eating_002', 'practice_most_common_meals_and_eating', 'Lunch', 'lunch'),
  ('practice_most_common_meals_and_eating_003', 'practice_most_common_meals_and_eating', 'Dinner', 'dinner'),
  ('practice_most_common_meals_and_eating_004', 'practice_most_common_meals_and_eating', 'Eat', 'eat'),
  ('practice_most_common_meals_and_eating_005', 'practice_most_common_meals_and_eating', 'Drink', 'drink'),
  ('practice_most_common_meals_and_eating_006', 'practice_most_common_meals_and_eating', 'Knife', 'knife'),
  ('practice_most_common_meals_and_eating_007', 'practice_most_common_meals_and_eating', 'Fork', 'fork'),
  ('practice_most_common_meals_and_eating_008', 'practice_most_common_meals_and_eating', 'Spoon', 'spoon'),
  ('practice_most_common_meals_and_eating_009', 'practice_most_common_meals_and_eating', 'Plate', 'plate'),
  ('practice_most_common_meals_and_eating_010', 'practice_most_common_meals_and_eating', 'Cup', 'cup'),
  ('practice_most_common_around_town_001', 'practice_most_common_around_town', 'Bank', 'bank'),
  ('practice_most_common_around_town_002', 'practice_most_common_around_town', 'Post Office', 'post office'),
  ('practice_most_common_around_town_003', 'practice_most_common_around_town', 'Café', 'café'),
  ('practice_most_common_around_town_004', 'practice_most_common_around_town', 'Restaurant', 'restaurant'),
  ('practice_most_common_around_town_005', 'practice_most_common_around_town', 'Pharmacy', 'pharmacy'),
  ('practice_most_common_around_town_006', 'practice_most_common_around_town', 'Hotel', 'hotel'),
  ('practice_most_common_around_town_007', 'practice_most_common_around_town', 'Supermarket', 'supermarket'),
  ('practice_most_common_around_town_008', 'practice_most_common_around_town', 'Library', 'library'),
  ('practice_most_common_around_town_009', 'practice_most_common_around_town', 'Museum', 'museum'),
  ('practice_most_common_around_town_010', 'practice_most_common_around_town', 'Cinema', 'cinema');

create temporary table prompt_capitalisation_skips (
  word_id text primary key,
  list_id text not null,
  english_prompt text not null,
  reason text not null
) on commit drop;

insert into prompt_capitalisation_skips (word_id, list_id, english_prompt, reason)
values
  ('practice_most_common_school_and_learning_010', 'practice_most_common_school_and_learning', 'Welsh', 'English proper noun');

create temporary table prompt_capitalisation_manual_review (
  word_id text primary key,
  list_id text not null,
  english_prompt text not null,
  reason text not null
) on commit drop;

create temporary table prompt_capitalisation_changed (
  word_id text,
  list_id text,
  previous_english_prompt text,
  normalised_english_prompt text,
  welsh_answer text
) on commit drop;

with updated as (
  update public.words as w
  set english_prompt = c.normalised_english_prompt
  from prompt_capitalisation_changes as c
  where w.id = c.word_id
    and w.list_id = c.list_id
    and w.english_prompt = c.expected_english_prompt
  returning
    w.id as word_id,
    w.list_id,
    c.expected_english_prompt as previous_english_prompt,
    w.english_prompt as normalised_english_prompt,
    w.welsh_answer
)
insert into prompt_capitalisation_changed (
  word_id,
  list_id,
  previous_english_prompt,
  normalised_english_prompt,
  welsh_answer
)
select
  word_id,
  list_id,
  previous_english_prompt,
  normalised_english_prompt,
  welsh_answer
from updated;

select
  'records_changed' as audit_section,
  word_id,
  list_id,
  previous_english_prompt,
  normalised_english_prompt,
  welsh_answer
from prompt_capitalisation_changed
order by list_id, word_id;

select
  'records_intentionally_skipped' as audit_section,
  s.word_id,
  s.list_id,
  s.english_prompt,
  w.welsh_answer,
  s.reason
from prompt_capitalisation_skips as s
left join public.words as w on w.id = s.word_id and w.list_id = s.list_id
order by s.list_id, s.word_id;

select
  'ambiguous_records_requiring_manual_review' as audit_section,
  word_id,
  list_id,
  english_prompt,
  reason
from prompt_capitalisation_manual_review
order by list_id, word_id;

select
  'review_unmatched_or_drifted_records' as audit_section,
  c.word_id,
  c.list_id,
  c.expected_english_prompt,
  c.normalised_english_prompt,
  w.english_prompt as current_english_prompt,
  w.welsh_answer
from prompt_capitalisation_changes as c
left join public.words as w on w.id = c.word_id and w.list_id = c.list_id
where w.id is null
  or w.english_prompt not in (c.expected_english_prompt, c.normalised_english_prompt)
order by c.list_id, c.word_id;

commit;
