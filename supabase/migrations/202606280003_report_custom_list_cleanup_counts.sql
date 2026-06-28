drop function if exists public.cleanup_expired_custom_word_lists();

create or replace function public.cleanup_expired_custom_word_lists()
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_list_count integer := 0;
  deleted_audio_count integer := 0;
begin
  with expired_audio_paths as (
    select distinct custom_words.audio_storage_path
    from public.custom_words
    join public.custom_word_lists on custom_word_lists.id = custom_words.custom_list_id
    where custom_word_lists.expires_at <= now()
      and custom_words.audio_storage_path <> ''
  ),
  deleted_audio as (
    delete from storage.objects
    where bucket_id = 'audio'
      and name in (select audio_storage_path from expired_audio_paths)
    returning name
  )
  select count(*) into deleted_audio_count from deleted_audio;

  with deleted_lists as (
    delete from public.custom_word_lists
    where expires_at <= now()
    returning id
  )
  select count(*) into deleted_list_count from deleted_lists;

  return jsonb_build_object(
    'expiredListCount', deleted_list_count,
    'audioFileCount', deleted_audio_count
  );
end;
$$;

revoke all on function public.cleanup_expired_custom_word_lists() from public;
grant execute on function public.cleanup_expired_custom_word_lists() to authenticated;
