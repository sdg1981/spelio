drop function if exists public.cleanup_expired_custom_word_lists();

create or replace function public.cleanup_expired_custom_word_lists()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_list_count integer := 0;
begin
  with deleted_lists as (
    delete from public.custom_word_lists
    where expires_at <= now()
    returning id
  )
  select count(*) into deleted_list_count from deleted_lists;

  return jsonb_build_object(
    'expiredListCount', deleted_list_count,
    'audioFileCount', 0
  );
end;
$$;

revoke all on function public.cleanup_expired_custom_word_lists() from public;
grant execute on function public.cleanup_expired_custom_word_lists() to authenticated;
