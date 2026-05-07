create table if not exists public.word_list_collections (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  type text not null check (type in ('spelio_core', 'curriculum', 'course', 'school', 'teacher', 'personal', 'custom')),
  source_language text not null default 'en',
  target_language text not null default 'cy',
  curriculum_key_stage text,
  curriculum_area text,
  owner_type text check (owner_type is null or owner_type in ('spelio', 'school', 'teacher', 'user')),
  owner_id text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_list_collections_slug_idx on public.word_list_collections(slug);
create index if not exists word_list_collections_order_index_idx on public.word_list_collections(order_index);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'word_list_collections_set_updated_at'
  ) then
    create trigger word_list_collections_set_updated_at
    before update on public.word_list_collections
    for each row execute function public.set_updated_at();
  end if;
end $$;

insert into public.word_list_collections (
  id,
  slug,
  name,
  description,
  type,
  source_language,
  target_language,
  owner_type,
  owner_id,
  order_index,
  is_active
) values (
  'spelio_core_welsh',
  'spelio-core-welsh',
  'Spelio Core Welsh',
  'Core Welsh spelling practice lists for the Spelio MVP.',
  'spelio_core',
  'en',
  'cy',
  'spelio',
  null,
  1,
  true
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  source_language = excluded.source_language,
  target_language = excluded.target_language,
  owner_type = excluded.owner_type,
  owner_id = excluded.owner_id,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

alter table public.word_lists
  add column if not exists collection_id text not null default 'spelio_core_welsh';

update public.word_lists
set collection_id = 'spelio_core_welsh'
where collection_id is null or collection_id = '';

alter table public.word_lists
  alter column collection_id set default 'spelio_core_welsh',
  alter column collection_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'word_lists_collection_id_fkey'
      and conrelid = 'public.word_lists'::regclass
  ) then
    alter table public.word_lists
      add constraint word_lists_collection_id_fkey
      foreign key (collection_id)
      references public.word_list_collections(id)
      on delete restrict;
  end if;
end $$;

create index if not exists word_lists_collection_id_idx on public.word_lists(collection_id);

alter table public.word_list_collections enable row level security;

-- TODO: Replace temporary authenticated-admin access with explicit roles and future ownership enforcement.
create policy "authenticated can read word list collections"
on public.word_list_collections for select
to authenticated
using (true);

create policy "authenticated can manage word list collections"
on public.word_list_collections for all
to authenticated
using (true)
with check (true);
