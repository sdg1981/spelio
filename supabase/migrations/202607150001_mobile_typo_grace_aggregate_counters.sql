create table public.mobile_typo_grace_daily_counts (
  day date not null default current_date,
  event_name text not null check (event_name in (
    'mobile_adjacent_typo_grace_triggered',
    'mobile_adjacent_typo_corrected',
    'mobile_adjacent_typo_committed_wrong'
  )),
  platform text not null check (platform in ('ios', 'android', 'other_mobile')),
  practice_context text not null check (practice_context in ('foundations', 'practice_library', 'other')),
  strict_mode boolean not null default false,
  event_count bigint not null default 0 check (event_count >= 0),
  primary key (day, event_name, platform, practice_context, strict_mode)
);

alter table public.mobile_typo_grace_daily_counts enable row level security;

create policy "authenticated can read mobile typo grace aggregates"
on public.mobile_typo_grace_daily_counts for select
to authenticated
using (true);

create or replace function public.increment_mobile_typo_grace_counter(
  p_event_name text,
  p_platform text,
  p_practice_context text,
  p_strict_mode boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_event_name not in (
    'mobile_adjacent_typo_grace_triggered',
    'mobile_adjacent_typo_corrected',
    'mobile_adjacent_typo_committed_wrong'
  ) then
    raise exception 'Unsupported typo grace event';
  end if;

  if p_platform not in ('ios', 'android', 'other_mobile') then
    raise exception 'Unsupported typo grace platform';
  end if;

  if p_practice_context not in ('foundations', 'practice_library', 'other') then
    raise exception 'Unsupported typo grace practice context';
  end if;

  insert into public.mobile_typo_grace_daily_counts (
    day, event_name, platform, practice_context, strict_mode, event_count
  ) values (
    current_date, p_event_name, p_platform, p_practice_context, coalesce(p_strict_mode, false), 1
  )
  on conflict (day, event_name, platform, practice_context, strict_mode)
  do update set event_count = public.mobile_typo_grace_daily_counts.event_count + 1;
end;
$$;

revoke all on function public.increment_mobile_typo_grace_counter(text, text, text, boolean) from public;
grant execute on function public.increment_mobile_typo_grace_counter(text, text, text, boolean) to anon;

comment on table public.mobile_typo_grace_daily_counts is
  'Aggregate-only probable adjacent-key mobile typo outcomes. Never stores raw answers, words, letters, letter pairs, or learner identifiers.';
