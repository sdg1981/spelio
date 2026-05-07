create policy "public can read active word list collections"
on public.word_list_collections for select
to anon
using (is_active = true);

create policy "public can read active word lists"
on public.word_lists for select
to anon
using (is_active = true);

create policy "public can read words for active word lists"
on public.words for select
to anon
using (
  exists (
    select 1
    from public.word_lists
    where word_lists.id = words.list_id
      and word_lists.is_active = true
  )
);
