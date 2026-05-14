alter table public.word_lists
  add column if not exists slug text;

with normalized as (
  select
    id,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        ''
      ),
      id
    ) as base_slug
  from public.word_lists
  where slug is null or slug = ''
),
numbered as (
  select
    id,
    base_slug,
    row_number() over (partition by base_slug order by id) as duplicate_index
  from normalized
)
update public.word_lists wl
set slug = case
  when numbered.duplicate_index = 1 then numbered.base_slug
  else numbered.base_slug || '-' || numbered.duplicate_index::text
end
from numbered
where wl.id = numbered.id;

alter table public.word_lists
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'word_lists_slug_format_check'
      and conrelid = 'public.word_lists'::regclass
  ) then
    alter table public.word_lists
      add constraint word_lists_slug_format_check
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;
end
$$;

create unique index if not exists word_lists_active_slug_unique_idx
  on public.word_lists(slug)
  where is_active;
