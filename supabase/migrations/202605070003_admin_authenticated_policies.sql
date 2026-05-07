-- Temporary MVP admin policies.
-- These policies allow signed-in Supabase users to manage editorial content while
-- preserving RLS and avoiding unauthenticated public writes.
-- TODO: Replace these with protected server/API routes and founder/admin role checks.

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
