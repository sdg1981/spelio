create extension if not exists pgcrypto;

create type public.audio_status as enum ('missing', 'queued', 'generating', 'generated', 'failed');
create type public.audio_job_status as enum ('queued', 'processing', 'completed', 'failed', 'cancelled');

create table public.stages (
  id text primary key,
  name text not null,
  description text not null default '',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.focus_categories (
  id text primary key,
  name text not null,
  description text not null default '',
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dialect_options (
  id text primary key,
  label text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.word_lists (
  id text primary key,
  name text not null,
  description text not null default '',
  language text not null default 'Welsh',
  source_language text not null default 'en',
  target_language text not null default 'cy',
  dialect text not null references public.dialect_options(id),
  stage_id text references public.stages(id),
  focus_category_id text references public.focus_categories(id),
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  order_index integer not null default 0,
  next_list_id text references public.word_lists(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.words (
  id text primary key,
  list_id text not null references public.word_lists(id) on delete cascade,
  english_prompt text not null,
  welsh_answer text not null,
  accepted_alternatives jsonb not null default '[]'::jsonb,
  audio_url text not null default '',
  audio_status public.audio_status not null default 'missing',
  notes text not null default '',
  usage_note text not null default '',
  dialect text not null references public.dialect_options(id),
  dialect_note text not null default '',
  variant_group_id text not null default '',
  order_index integer not null default 0,
  difficulty integer not null default 1 check (difficulty between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint words_accepted_alternatives_array check (jsonb_typeof(accepted_alternatives) = 'array')
);

create table public.audio_jobs (
  id uuid primary key default gen_random_uuid(),
  word_id text not null references public.words(id) on delete cascade,
  status public.audio_job_status not null default 'queued',
  provider text not null default 'azure',
  voice_id text not null default '',
  error_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index word_lists_stage_id_idx on public.word_lists(stage_id);
create index word_lists_focus_category_id_idx on public.word_lists(focus_category_id);
create index word_lists_order_index_idx on public.word_lists(order_index);
create index words_list_id_order_index_idx on public.words(list_id, order_index);
create index words_audio_status_idx on public.words(audio_status);
create index words_variant_group_id_idx on public.words(variant_group_id) where variant_group_id <> '';
create index audio_jobs_status_idx on public.audio_jobs(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger stages_set_updated_at before update on public.stages for each row execute function public.set_updated_at();
create trigger focus_categories_set_updated_at before update on public.focus_categories for each row execute function public.set_updated_at();
create trigger dialect_options_set_updated_at before update on public.dialect_options for each row execute function public.set_updated_at();
create trigger word_lists_set_updated_at before update on public.word_lists for each row execute function public.set_updated_at();
create trigger words_set_updated_at before update on public.words for each row execute function public.set_updated_at();
create trigger audio_jobs_set_updated_at before update on public.audio_jobs for each row execute function public.set_updated_at();
create trigger admin_settings_set_updated_at before update on public.admin_settings for each row execute function public.set_updated_at();

alter table public.stages enable row level security;
alter table public.focus_categories enable row level security;
alter table public.dialect_options enable row level security;
alter table public.word_lists enable row level security;
alter table public.words enable row level security;
alter table public.audio_jobs enable row level security;
alter table public.admin_settings enable row level security;

-- Public learner reads can be added later as narrow select policies for active content only.
-- TODO: Route admin writes through protected server/API endpoints using a server-side Supabase client.
-- No broad anonymous write policies are created in this foundation.
