update public.word_lists
set icon_name = 'Briefcase'
where id = 'practice_most_common_work'
  and (icon_name is null or icon_name = '' or icon_name = 'BriefcaseBusiness');
