-- Run after a local reset with `supabase test db`, or transactionally against
-- DEVELOPMENT only after that environment is explicitly authorized.
begin;

do $$
declare
  matrix record;
  operation text;
  expected boolean;
  actual boolean;
begin
  for matrix in
    select * from (values
      ('anon', 'stages', array['SELECT']::text[]),
      ('anon', 'focus_categories', array[]::text[]),
      ('anon', 'dialect_options', array[]::text[]),
      ('anon', 'word_list_collections', array['SELECT']::text[]),
      ('anon', 'word_lists', array['SELECT']::text[]),
      ('anon', 'words', array['SELECT']::text[]),
      ('anon', 'audio_jobs', array[]::text[]),
      ('anon', 'admin_settings', array['SELECT']::text[]),
      ('anon', 'custom_word_lists', array['SELECT']::text[]),
      ('anon', 'custom_words', array['SELECT']::text[]),
      ('anon', 'mobile_typo_grace_daily_counts', array[]::text[]),
      ('authenticated', 'stages', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'focus_categories', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'dialect_options', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'word_list_collections', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'word_lists', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'words', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'audio_jobs', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'admin_settings', array['SELECT', 'INSERT', 'UPDATE', 'DELETE']::text[]),
      ('authenticated', 'custom_word_lists', array['SELECT']::text[]),
      ('authenticated', 'custom_words', array['SELECT']::text[]),
      ('authenticated', 'mobile_typo_grace_daily_counts', array['SELECT']::text[]),
      ('service_role', 'stages', array[]::text[]),
      ('service_role', 'focus_categories', array[]::text[]),
      ('service_role', 'dialect_options', array[]::text[]),
      ('service_role', 'word_list_collections', array[]::text[]),
      ('service_role', 'word_lists', array[]::text[]),
      ('service_role', 'words', array[]::text[]),
      ('service_role', 'audio_jobs', array[]::text[]),
      ('service_role', 'admin_settings', array[]::text[]),
      ('service_role', 'custom_word_lists', array['SELECT', 'INSERT', 'DELETE']::text[]),
      ('service_role', 'custom_words', array['SELECT', 'INSERT']::text[]),
      ('service_role', 'mobile_typo_grace_daily_counts', array[]::text[])
    ) as expected(role_name, table_name, allowed_operations)
  loop
    foreach operation in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']::text[]
    loop
      expected := operation = any(matrix.allowed_operations);
      actual := has_table_privilege(matrix.role_name, format('public.%I', matrix.table_name), operation);

      if actual is distinct from expected then
        raise exception 'Unexpected privilege: role %, table public.%, operation %, expected %, got %',
          matrix.role_name, matrix.table_name, operation, expected, actual;
      end if;
    end loop;
  end loop;

  if exists (
    select 1
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    cross join lateral aclexplode(coalesce(relation.relacl, acldefault('r', relation.relowner))) as privilege
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p')
      and privilege.grantee = 0
  ) then
    raise exception 'PUBLIC retains a privilege on a public table';
  end if;

  if exists (
    select 1
    from pg_attribute as attribute
    join pg_class as relation on relation.oid = attribute.attrelid
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p')
      and attribute.attnum > 0
      and not attribute.attisdropped
      and attribute.attacl is not null
  ) then
    raise exception 'Unexpected column-level privileges exist in public';
  end if;

  if exists (
    select 1
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind = 'S'
  ) then
    raise exception 'A public sequence exists; add its explicit privilege matrix to this regression';
  end if;
end
$$;

do $$
declare
  check_row record;
  actual boolean;
begin
  for check_row in
    select * from (values
      ('anon', 'public.set_updated_at()', false),
      ('authenticated', 'public.set_updated_at()', false),
      ('service_role', 'public.set_updated_at()', false),
      ('anon', 'public.cleanup_expired_custom_word_lists()', false),
      ('authenticated', 'public.cleanup_expired_custom_word_lists()', true),
      ('service_role', 'public.cleanup_expired_custom_word_lists()', false),
      ('anon', 'public.increment_mobile_typo_grace_counter(text,text,text,boolean)', true),
      ('authenticated', 'public.increment_mobile_typo_grace_counter(text,text,text,boolean)', false),
      ('service_role', 'public.increment_mobile_typo_grace_counter(text,text,text,boolean)', false)
    ) as expected(role_name, function_signature, can_execute)
  loop
    actual := has_function_privilege(check_row.role_name, check_row.function_signature, 'EXECUTE');
    if actual is distinct from check_row.can_execute then
      raise exception 'Unexpected EXECUTE privilege: role %, function %, expected %, got %',
        check_row.role_name, check_row.function_signature, check_row.can_execute, actual;
    end if;
  end loop;

  if exists (
    select 1
    from pg_proc as routine
    join pg_namespace as namespace on namespace.oid = routine.pronamespace
    cross join lateral aclexplode(coalesce(routine.proacl, acldefault('f', routine.proowner))) as privilege
    where namespace.nspname = 'public'
      and routine.oid in (
        'public.set_updated_at()'::regprocedure,
        'public.cleanup_expired_custom_word_lists()'::regprocedure,
        'public.increment_mobile_typo_grace_counter(text,text,text,boolean)'::regprocedure
      )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'PUBLIC retains EXECUTE on a Spelio public function';
  end if;
end
$$;

rollback;
