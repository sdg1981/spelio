create table if not exists public.custom_word_lists (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  title text not null default 'Custom spelling list',
  source_language text not null default 'en',
  target_language text not null default 'cy',
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed', 'rejected')),
  moderation_status text not null default 'pass' check (moderation_status in ('pass', 'rejected', 'failed')),
  moderation_provider text not null default '',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_word_lists_public_id_format_check check (public_id ~ '^[A-Za-z0-9_-]{16,96}$')
);

create table if not exists public.custom_words (
  id uuid primary key default gen_random_uuid(),
  custom_list_id uuid not null references public.custom_word_lists(id) on delete cascade,
  welsh_answer text not null check (char_length(welsh_answer) between 1 and 80),
  english_prompt text check (english_prompt is null or char_length(english_prompt) <= 120),
  audio_url text not null,
  audio_storage_path text not null default '',
  audio_status text not null default 'ready' check (audio_status in ('ready', 'failed')),
  order_index integer not null check (order_index between 1 and 10),
  created_at timestamptz not null default now(),
  constraint custom_words_audio_required_check check (audio_status <> 'ready' or audio_url <> '')
);

create unique index if not exists custom_words_list_order_unique_idx
  on public.custom_words(custom_list_id, order_index);

create index if not exists custom_word_lists_public_ready_idx
  on public.custom_word_lists(public_id)
  where status = 'ready';

create index if not exists custom_word_lists_expires_at_idx
  on public.custom_word_lists(expires_at);

create trigger custom_word_lists_set_updated_at
  before update on public.custom_word_lists
  for each row execute function public.set_updated_at();

alter table public.custom_word_lists enable row level security;
alter table public.custom_words enable row level security;

create policy "public can read ready unexpired custom lists"
on public.custom_word_lists for select
to anon
using (status = 'ready' and expires_at > now());

create policy "public can read words for ready unexpired custom lists"
on public.custom_words for select
to anon
using (
  exists (
    select 1
    from public.custom_word_lists
    where custom_word_lists.id = custom_words.custom_list_id
      and custom_word_lists.status = 'ready'
      and custom_word_lists.expires_at > now()
  )
);

create policy "authenticated can read custom lists"
on public.custom_word_lists for select
to authenticated
using (true);

create policy "authenticated can read custom words"
on public.custom_words for select
to authenticated
using (true);

create or replace function public.cleanup_expired_custom_word_lists()
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_count integer := 0;
begin
  delete from storage.objects
  where bucket_id = 'audio'
    and name in (
      select audio_storage_path
      from public.custom_words
      join public.custom_word_lists on custom_word_lists.id = custom_words.custom_list_id
      where custom_word_lists.expires_at <= now()
        and custom_words.audio_storage_path <> ''
    );

  with deleted as (
    delete from public.custom_word_lists
    where expires_at <= now()
    returning id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;

revoke all on function public.cleanup_expired_custom_word_lists() from public;
grant execute on function public.cleanup_expired_custom_word_lists() to authenticated;
