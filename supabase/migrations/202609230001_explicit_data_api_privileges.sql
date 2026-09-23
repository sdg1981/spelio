-- Supabase stops adding implicit Data API grants to new public objects on
-- 2026-10-30. Keep both existing and fresh Spelio databases on the same,
-- least-privilege model and make future exposure opt-in.

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

-- Editorial and public content.
revoke all on table public.stages from public, anon, authenticated, service_role;
revoke all on table public.focus_categories from public, anon, authenticated, service_role;
revoke all on table public.dialect_options from public, anon, authenticated, service_role;
revoke all on table public.word_list_collections from public, anon, authenticated, service_role;
revoke all on table public.word_lists from public, anon, authenticated, service_role;
revoke all on table public.words from public, anon, authenticated, service_role;
revoke all on table public.audio_jobs from public, anon, authenticated, service_role;
revoke all on table public.admin_settings from public, anon, authenticated, service_role;

-- The public loader still embeds stages(name) for compatibility. Anonymous
-- SELECT is therefore required at the grant layer; stages has no anon RLS
-- policy, so no stage rows are exposed.
grant select on table public.stages to anon;
grant select on table public.word_list_collections to anon;
grant select on table public.word_lists to anon;
grant select on table public.words to anon;
grant select on table public.admin_settings to anon;

grant select, insert, update, delete on table public.stages to authenticated;
grant select, insert, update, delete on table public.focus_categories to authenticated;
grant select, insert, update, delete on table public.dialect_options to authenticated;
grant select, insert, update, delete on table public.word_list_collections to authenticated;
grant select, insert, update, delete on table public.word_lists to authenticated;
grant select, insert, update, delete on table public.words to authenticated;
grant select, insert, update, delete on table public.audio_jobs to authenticated;
grant select, insert, update, delete on table public.admin_settings to authenticated;

-- Temporary custom lists are written and cleaned up only by server-side code.
revoke all on table public.custom_word_lists from public, anon, authenticated, service_role;
revoke all on table public.custom_words from public, anon, authenticated, service_role;

grant select on table public.custom_word_lists to anon, authenticated;
grant select on table public.custom_words to anon, authenticated;

grant select, insert, delete on table public.custom_word_lists to service_role;
grant select, insert on table public.custom_words to service_role;

-- Aggregate telemetry is RPC-write-only for anonymous learners and directly
-- readable only by signed-in admins.
revoke all on table public.mobile_typo_grace_daily_counts from public, anon, authenticated, service_role;
grant select on table public.mobile_typo_grace_daily_counts to authenticated;

-- PostgreSQL grants function execution to PUBLIC by default, and historical
-- Supabase defaults could add direct Data API role grants. Normalize both.
revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.cleanup_expired_custom_word_lists() from public, anon, authenticated, service_role;
revoke all on function public.increment_mobile_typo_grace_counter(text, text, text, boolean) from public, anon, authenticated, service_role;

grant execute on function public.cleanup_expired_custom_word_lists() to authenticated;
grant execute on function public.increment_mobile_typo_grace_counter(text, text, text, boolean) to anon;
