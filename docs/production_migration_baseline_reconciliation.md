# Production migration baseline reconciliation

Date: 24 September 2026

## Scope and project identity

This record covers the authorized reconciliation and Data API hardening of the
production project:

- name: `Spelio App`
- project reference: `pybyqcmzattdmdxuhrtl`
- region: `eu-west-1`
- status at rollout: `ACTIVE_HEALTHY`

The repository was linked back to the healthy DEVELOPMENT project, `Spelio App
Dev` (`xxzugbaupdxqpkmwcuem`), after production verification.

## Migration-ledger reconciliation

Production contained the audited cumulative database state but had no
`supabase_migrations` ledger. Historical migrations were not replayed against
the existing objects. Based on the completed schema, content, policy, function,
trigger, index, constraint, and comment audit:

- the 81 repository versions from `202605070001` through `202608070001` were
  recorded as applied;
- `202606250001` was retained as legitimate applied history;
- `202609220001` was recorded only after its cumulative final state was proven;
- `202609220002_reconcile_production_migration_baseline.sql` was applied and
  recorded;
- the resulting dry run identified only
  `202609230001_explicit_data_api_privileges.sql` as pending;
- `202609230001` was then applied normally with `supabase db push`.

The final production ledger contains all 84 local versions through
`202609230001`, and a final dry run reported the remote database up to date.

DEVELOPMENT already contained the complete effect of `202609220002`, so that
version was recorded as applied there after a read-only state check. Its final
ledger and dry run are also synchronized.

## Production normalization

Migration `202609220002` performs only the approved, idempotent normalization:

- sets the 20 Practice Library list order values to the repository sequence,
  including People & Family 3, Home 4, Places 5, and Travel 6;
- updates the Meals & Dining English/Welsh name and description to the current
  repository copy;
- drops the four redundant production-only authenticated CRUD policies on
  `word_list_collections`.

It deliberately does not alter collection activation, word rows, audio fields,
enum or physical column ordering, custom lists, telemetry, storage objects, or
storage policies.

## Preserved production state

Post-rollout verification confirmed:

- `practice.is_active = true`;
- `spelio_core_welsh.is_active = false`;
- the audited production review values remain `coffee` / `coffi`, `thanks` /
  `diolch`, and `easy` / `hawdd`, with their existing ready audio URLs;
- the milk variants remain `llaeth` and `llefrith`, with the corrected North
  and South Wales dialect notes and existing ready audio URLs;
- both pre-existing custom-list IDs and all three pre-existing custom-word IDs
  remain present;
- the public `audio` bucket configuration and its three storage policies are
  unchanged;
- the harmless enum-label ordering and physical column ordering were not
  normalized.

## Data API hardening verification

The production privilege model matches the DEVELOPMENT-verified model:

- anonymous users have only the intended read surfaces and telemetry RPC;
- authenticated users have the intended editorial CRUD, custom-list and
  telemetry reads, and cleanup RPC;
- `service_role` has only the intended temporary custom-list operations;
- the three Spelio functions expose only their intended `EXECUTE` grants;
- no `PUBLIC` table access or `PUBLIC` execution on the three Spelio functions
  remains;
- no column-level grants or public-schema sequences exist;
- all 11 application tables retain RLS and all 26 intended public-schema
  policies remain;
- the four redundant collection policies are absent.

Default Data API privileges for future public objects created by `postgres`,
the role used by repository migrations, are revoked. Supabase's platform-owned
`supabase_admin` defaults remain platform-managed and were intentionally not
altered; they do not restore privileges on the explicitly normalized Spelio
objects or control objects created by the repository migration role.

Verification completed successfully:

- linked database lint at error level: no schema errors;
- rollback-only privilege regression: passed;
- assertion-backed live-role smoke test inside a rolled-back transaction:
  passed;
- `npm run verify:supabase-privileges`: 11 tables across 84 migrations passed;
- full `npm test`: passed.

No frontend, Edge Function, secret, enum-order, physical-column-order, or
unrelated application changes were made, and no commits were pushed.
