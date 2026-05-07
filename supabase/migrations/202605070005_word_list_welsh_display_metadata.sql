alter table public.word_lists
  add column if not exists name_cy text,
  add column if not exists description_cy text;

update public.word_lists as word_list
set
  name_cy = display_values.name_cy,
  description_cy = display_values.description_cy
from (values
  ('foundations_first_words', 'Geiriau Cyntaf — Cymraeg Sydyn', 'Geiriau Cymraeg hanfodol y byddwch yn eu hadnabod a’u defnyddio ar unwaith. Yn cynnwys amrywiadau tafodieithol ar lefel gair.'),
  ('foundations_verbs', 'Berfau Cyntaf — Gweithredoedd Craidd', 'Berfau Cymraeg hanfodol ar gyfer bywyd pob dydd.'),
  ('foundations_first_phrases', 'Ymadroddion Cyntaf — Defnyddio Berfau', 'Ymadroddion Cymraeg syml wedi’u hadeiladu o ferfau cyffredin.'),
  ('foundations_small_words', 'Geiriau Bach Defnyddiol — Cysylltwyr', 'Geiriau Cymraeg bach sy’n cysylltu syniadau ac yn adeiladu brawddegau. Yn cynnwys amrywiadau tafodieithol ar lefel gair.'),
  ('foundations_actions', 'Gweithredoedd Pob Dydd — Ymadroddion Estynedig', 'Gweithredoedd cyffredin fel ymadroddion Cymraeg defnyddiol.'),
  ('foundations_places', 'Lleoedd Pob Dydd', 'Lleoedd cyffredin mewn Cymraeg pob dydd.'),
  ('foundations_time', 'Siarad am Amser — Craidd', 'Geiriau ac ymadroddion Cymraeg syml ar gyfer siarad am amser. Yn cynnwys amrywiadau tafodieithol ar lefel gair.'),
  ('foundations_numbers', 'Rhifau — 1 i 10', 'Rhifau Cymraeg sylfaenol ar gyfer sefyllfaoedd pob dydd.'),
  ('foundations_mixed_01', 'Ymarfer Cymysg — Sylfeini', 'Cymysgedd o eiriau ac ymadroddion i atgyfnerthu beth rydych wedi’i ddysgu.'),
  ('foundations_mixed_02', 'Ymarfer Cymysg — Defnydd Go Iawn', 'Ymarfer Cymraeg go iawn gyda chymysgedd o eiriau ac ymadroddion defnyddiol.'),
  ('stage2_food', 'Bwyd a Diod — Hanfodion', 'Geiriau Cymraeg cyffredin am fwyd a diod pob dydd.'),
  ('stage2_people', 'Pobl a Theulu', 'Geiriau am bobl a theulu mewn Cymraeg pob dydd.'),
  ('stage2_work', 'Gwaith a Bywyd Pob Dydd', 'Geiriau Cymraeg defnyddiol ar gyfer gwaith a threfn bob dydd.'),
  ('stage2_weather', 'Tywydd — Craidd', 'Geiriau Cymraeg sylfaenol ar gyfer siarad am y tywydd.'),
  ('stage2_adjectives', 'Ansoddeiriau Cyffredin', 'Ansoddeiriau Cymraeg defnyddiol ar gyfer disgrifio pethau pob dydd.'),
  ('stage2_adverbs', 'Adferfau Cyffredin', 'Adferfau Cymraeg defnyddiol ar gyfer siarad bob dydd.'),
  ('stage2_ll', 'Ffocws Sillafu — LL', 'Ymarfer geiriau Cymraeg gyda’r sain “ll”.'),
  ('stage2_ch', 'Ffocws Sillafu — CH', 'Ymarfer geiriau Cymraeg gyda’r sain “ch”.'),
  ('stage2_phrases_going', 'Ymadroddion Byr — Mynd i Rywle', 'Ymadroddion Cymraeg defnyddiol ar gyfer siarad am fynd i leoedd.'),
  ('stage2_phrases_wanting', 'Ymadroddion Byr — Eisiau ac Angen', 'Ymadroddion Cymraeg defnyddiol ar gyfer mynegi eisiau ac angen. Yn cynnwys amrywiadau tafodieithol ar lefel gair.'),
  ('stage3_f_vs_ff', 'Cyferbyniad Sillafu — F vs FF', 'Ymarfer y gwahaniaeth rhwng “f” ac “ff” yn Gymraeg.'),
  ('stage3_d_vs_dd', 'Cyferbyniad Sillafu — D vs DD', 'Ymarfer y gwahaniaeth rhwng “d” a “dd” yn Gymraeg.'),
  ('stage3_wy', 'Patrymau Llafariaid — WY', 'Ymarfer geiriau Cymraeg gyda’r patrwm “wy”.'),
  ('stage3_ae', 'Patrymau Llafariaid — AE', 'Ymarfer geiriau Cymraeg gyda’r patrwm “ae”.'),
  ('stage3_time_phrases', 'Ymadroddion Byr — Amser a Threfn', 'Ymadroddion Cymraeg defnyddiol ar gyfer trefn bob dydd.'),
  ('stage3_coming', 'Ymadroddion Byr — Dod a Mynd', 'Ymadroddion Cymraeg defnyddiol ar gyfer symud a chyfeiriad.'),
  ('stage3_to_phrases', 'Cymraeg Go Iawn — Ymadroddion “i”', 'Ymarfer ymadroddion Cymraeg go iawn sy’n defnyddio “i”.'),
  ('stage4_in_phrases', 'Cymraeg Go Iawn — “yn” ac “yng”', 'Ymarfer ymadroddion Cymraeg go iawn sy’n defnyddio “yn” ac “yng”.'),
  ('stage4_connectors', 'Cysylltwyr Defnyddiol — Cam Nesaf', 'Geiriau Cymraeg defnyddiol sy’n gwneud siarad ac ysgrifennu’n fwy cysylltiedig.'),
  ('stage4_questions', 'Gofyn Cwestiynau — Ymadroddion', 'Geiriau cwestiwn Cymraeg cyffredin ac ymadroddion cwestiwn byr.'),
  ('stage4_sentences', 'Brawddegau Pob Dydd — Cychwyn', 'Brawddegau Cymraeg byr a defnyddiol. Yn cynnwys amrywiadau tafodieithol ar lefel gair.'),
  ('stage4_work_phrases', 'Ymadroddion Gwaith a Bywyd', 'Ymadroddion Cymraeg defnyddiol ar gyfer sefyllfaoedd pob dydd.'),
  ('stage5_my_phrases', 'Cymraeg Go Iawn — “fy”', 'Ymarfer ymadroddion Cymraeg go iawn sy’n defnyddio “fy”.'),
  ('stage5_mixed', 'Ymarfer Cymysg — Cymraeg Pob Dydd', 'Cymysgedd o eiriau ac ymadroddion Cymraeg defnyddiol ar gyfer ymarfer go iawn. Yn cynnwys amrywiadau tafodieithol ar lefel gair.'),
  ('stage5_long_words', 'Geiriau Cymraeg Hirach — Craidd', 'Ymarfer sillafu geiriau Cymraeg hirach yn hyderus.')
) as display_values(id, name_cy, description_cy)
where word_list.id = display_values.id;
