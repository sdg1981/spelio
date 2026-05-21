-- Repair the existing MVP admin model: signed-in Supabase admins can manage
-- editorial content, while anonymous learners keep read-only active-content access.
-- This intentionally does not add any anon insert/update/delete policies.

drop policy if exists "authenticated can read stages" on public.stages;
drop policy if exists "authenticated can manage stages" on public.stages;
drop policy if exists "authenticated can read focus categories" on public.focus_categories;
drop policy if exists "authenticated can manage focus categories" on public.focus_categories;
drop policy if exists "authenticated can read dialect options" on public.dialect_options;
drop policy if exists "authenticated can manage dialect options" on public.dialect_options;
drop policy if exists "authenticated can read word list collections" on public.word_list_collections;
drop policy if exists "authenticated can manage word list collections" on public.word_list_collections;
drop policy if exists "authenticated can read word lists" on public.word_lists;
drop policy if exists "authenticated can manage word lists" on public.word_lists;
drop policy if exists "authenticated can read words" on public.words;
drop policy if exists "authenticated can manage words" on public.words;
drop policy if exists "authenticated can read audio jobs" on public.audio_jobs;
drop policy if exists "authenticated can manage audio jobs" on public.audio_jobs;
drop policy if exists "authenticated can read admin settings" on public.admin_settings;
drop policy if exists "authenticated can manage admin settings" on public.admin_settings;

alter table public.stages enable row level security;
alter table public.focus_categories enable row level security;
alter table public.dialect_options enable row level security;
alter table public.word_list_collections enable row level security;
alter table public.word_lists enable row level security;
alter table public.words enable row level security;
alter table public.audio_jobs enable row level security;
alter table public.admin_settings enable row level security;

create policy "authenticated can read stages"
on public.stages for select
to authenticated
using (true);

create policy "authenticated can manage stages"
on public.stages for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read focus categories"
on public.focus_categories for select
to authenticated
using (true);

create policy "authenticated can manage focus categories"
on public.focus_categories for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read dialect options"
on public.dialect_options for select
to authenticated
using (true);

create policy "authenticated can manage dialect options"
on public.dialect_options for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read word list collections"
on public.word_list_collections for select
to authenticated
using (true);

create policy "authenticated can manage word list collections"
on public.word_list_collections for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read word lists"
on public.word_lists for select
to authenticated
using (true);

create policy "authenticated can manage word lists"
on public.word_lists for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read words"
on public.words for select
to authenticated
using (true);

create policy "authenticated can manage words"
on public.words for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read audio jobs"
on public.audio_jobs for select
to authenticated
using (true);

create policy "authenticated can manage audio jobs"
on public.audio_jobs for all
to authenticated
using (true)
with check (true);

create policy "authenticated can read admin settings"
on public.admin_settings for select
to authenticated
using (true);

create policy "authenticated can manage admin settings"
on public.admin_settings for all
to authenticated
using (true)
with check (true);
