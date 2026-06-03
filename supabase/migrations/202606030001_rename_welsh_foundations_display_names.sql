alter table public.word_list_collections
  add column if not exists name_cy text,
  add column if not exists description_cy text;

update public.stages
set name = 'Foundations'
where id = 'foundations'
  and name is distinct from 'Foundations';

update public.word_list_collections
set
  name = 'Welsh Spelling Foundations',
  name_cy = 'Sylfeini Sillafu Cymraeg',
  description_cy = 'Patrymau sillafu Cymraeg cyffredin i helpu sillafu i deimlo’n fwy cyfarwydd a rhagweladwy.'
where id = 'spelio_welsh_foundations'
  and (
    name is distinct from 'Welsh Spelling Foundations'
    or name_cy is distinct from 'Sylfeini Sillafu Cymraeg'
    or description_cy is distinct from 'Patrymau sillafu Cymraeg cyffredin i helpu sillafu i deimlo’n fwy cyfarwydd a rhagweladwy.'
  );

update public.word_lists as word_list
set
  name_cy = display_values.name_cy,
  description_cy = display_values.description_cy
from (values
  ('foundation_patterns_d_dd', 'D / DD', 'Mae D a DD yn cynrychioli synau gwahanol yn Gymraeg. Gydag ymarfer, maen nhw’n dod yn haws i’w hadnabod yn gyflym.'),
  ('foundation_patterns_y', 'Y', 'Mae Y yn ymddwyn yn wahanol yn dibynnu ar ble mae’n ymddangos mewn gair. Dyma un o’r patrymau sillafu Cymraeg mwyaf defnyddiol i ddod yn gyfarwydd ag ef.'),
  ('foundation_patterns_f_ff', 'F / FF', 'Mae F ac FF Cymraeg yn ymddwyn yn wahanol i Saesneg. Unwaith y daw’r patrwm hwn yn gyfarwydd, mae llawer o eiriau Cymraeg yn dod yn llawer haws i’w sillafu.'),
  ('foundation_patterns_w', 'W', 'Yn wahanol i Saesneg, mae Cymraeg yn aml yn defnyddio W fel rhan o sain llafariad. Mae’r patrwm hwn yn ymddangos drwy’r iaith.'),
  ('foundation_patterns_mixed_confidence_1_revised', 'Hyder Cymysg — Sylfeini 1', 'Mae’r geiriau hyn yn cyfuno sawl patrwm o’r gwersi cynharach. Y nod yw hyder, nid perffeithrwydd.'),
  ('foundation_patterns_ch', 'CH', 'CH yw un o’r patrymau sillafu Cymraeg mwyaf adnabyddus. Nid yw’n cael ei ynganu fel CH yn y gair Saesneg “church”.'),
  ('foundation_patterns_ll', 'LL', 'LL yw un o’r patrymau sillafu Cymraeg mwyaf nodedig. Mae llawer o enwau lleoedd a geiriau pob dydd Cymraeg yn cynnwys LL. Gydag ymarfer, mae’n dod yn haws i’w hadnabod.'),
  ('foundation_patterns_rh', 'RH', 'Mae RH yn batrwm sillafu Cymraeg cyffredin. Unwaith y daw’n gyfarwydd, mae’n hawdd ei weld mewn Cymraeg pob dydd.'),
  ('foundation_patterns_ae_ai', 'AE / AI', 'Mae AI ac AE yn ymddangos mewn llawer o eiriau Cymraeg cyffredin. Er eu bod yn cael eu sillafu’n wahanol, maen nhw’n aml yn creu synau tebyg iawn.'),
  ('foundation_patterns_mixed_confidence_2_revised', 'Hyder Cymysg — Sylfeini 2', 'Mae llawer o’r geiriau hyn yn cynnwys patrymau rydych eisoes wedi’u dysgu. Ceisiwch sylwi sut mae’r patrymau hynny’n dod yn haws i’w hadnabod.'),
  ('foundation_patterns_wy', 'WY', 'Mae WY yn ymddangos mewn nifer o eiriau Cymraeg cyffredin. Gall yr union sain amrywio mewn rhai sefyllfaoedd, ond mae’r enghreifftiau hyn yn fan cychwyn defnyddiol.'),
  ('foundation_patterns_yw', 'YW', 'Mae YW fel arfer yn llawer mwy cyson na WY. Unwaith y daw’n gyfarwydd, mae’n hawdd ei adnabod mewn geiriau Cymraeg.'),
  ('foundation_patterns_oe', 'OE', 'OE yw un o’r cyfuniadau llafariaid Cymraeg mwy cyson. Mae’r un sain yn ymddangos mewn llawer o eiriau Cymraeg.'),
  ('foundation_patterns_au', 'AU', 'Mae AU yn ymddangos mewn amrywiaeth o eiriau Cymraeg. Er y gall edrych yn anghyfarwydd ar y dechrau, mae’r sain yn dod yn hawdd i’w hadnabod.'),
  ('foundation_patterns_aw', 'AW', 'Mae AW yn batrwm llafariad Cymraeg cyffredin arall. Mae llawer o ddysgwyr yn ei weld yn haws na’r disgwyl oherwydd bod y sain yn eithaf cyfarwydd i siaradwyr Saesneg.'),
  ('foundation_patterns_mixed_confidence_3_revised', 'Hyder Cymysg — Sylfeini 3', 'Erbyn hyn rydych wedi gweld llawer o’r patrymau sillafu Cymraeg pwysicaf. Y nod yw eu hadnabod yn naturiol pan fyddant yn ymddangos gyda’i gilydd.'),
  ('foundation_patterns_u', 'U', 'Mae llawer o ddysgwyr yn disgwyl i U ymddwyn fel U Saesneg. Yn Gymraeg, mae’n aml yn swnio’n wahanol iawn. Gydag ymarfer, mae’r patrwm yn dod yn gyfarwydd.'),
  ('foundation_patterns_c', 'C', 'Yn wahanol i Saesneg, nid yw C Gymraeg yn newid ei sain. Mae hyn yn gwneud sillafu Cymraeg yn fwy rhagweladwy.'),
  ('foundation_patterns_g', 'G', 'Mae G Gymraeg yn ymddwyn yn gyson. Nid yw’n newid rhwng synau caled a meddal fel y gall wneud yn Saesneg.'),
  ('foundation_patterns_th_vs_dd', 'TH vs DD', 'Mae TH a DD yn aml yn cael eu drysu gan siaradwyr Saesneg. Mae dysgu clywed y gwahaniaeth yn gwneud llawer o eiriau Cymraeg yn haws i’w hadnabod a’u sillafu.'),
  ('foundation_patterns_mixed_confidence_4_revised', 'Hyder Cymysg — Sylfeini 4', 'Bwriad y geiriau hyn yw teimlo ychydig yn fwy naturiol ac yn llai rheoledig na’r gwersi cynharach. Sylwch faint o batrymau cyfarwydd sy’n ymddangos yn awtomatig erbyn hyn.'),
  ('foundation_patterns_mixed_confidence_5', 'Hyder Cymysg — Sylfeini 5', 'Adolygiad hyder olaf sy’n cyfuno patrymau sillafu Cymraeg cyfarwydd mewn geiriau defnyddiol.')
) as display_values(id, name_cy, description_cy)
where word_list.id = display_values.id;
