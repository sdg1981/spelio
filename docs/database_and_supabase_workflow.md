# Database and Supabase workflow

Spelio's authoritative branch is `main`. The repository has a tracked `dev`
branch, but it is behind `main` and is not the migration source of truth.

The checked-out Supabase CLI link identifies DEVELOPMENT as project
`xxzugbaupdxqpkmwcuem` (`Spelio App Dev`). The production project is not
explicitly labelled in configuration; committed production content exports use
the project ref `pybyqcmzattdmdxuhrtl`. Confirm environment identity out of band
before any remote command. Never infer a safe deployment target from the active
CLI link alone.

## Migration workflow

- Treat committed files in `supabase/migrations/` as immutable once applied.
  Correct or normalize database state with a new additive migration.
- Never delete a migration file after it has been applied to any shared
  environment. The file is part of the audit trail and is required to rebuild a
  fresh database consistently.
- Make DEVELOPMENT and PRODUCTION schema and reference-content changes through
  committed migrations. Do not use the SQL editor or application/admin tooling
  to bypass migration history for changes that belong in the database baseline.
- Before any database deployment, compare the complete local migration sequence
  with `supabase migration list --linked` and run `supabase db push --linked
  --dry-run`. Stop on remote-only versions, unexplained local-only versions, or
  name/version mismatches.
- Migration-history repair is an audit operation, not a way to unblock a push.
  Mark a version applied only after direct schema/catalog/data evidence proves
  its complete effect exists, or after a documented later migration has
  deliberately superseded its intermediate state. Preserve the evidence and
  reconcile genuine missing or divergent state before repairing the ledger.
- Reconstruct locally with `supabase db reset` when the existing local Supabase
  stack is available. Do not install Docker solely to run this check.
- Run application checks with `npm test` and `npm run build` as appropriate.
- Do not push migrations to DEVELOPMENT or PRODUCTION without explicit review
  and authorization. Validate on DEVELOPMENT before considering production.

## Data API privileges

Supabase is removing historical automatic Data API grants for newly created
objects in `public`; the change reaches existing projects on 30 October 2026.
Spelio opts in explicitly. Migration `202609230001_explicit_data_api_privileges.sql`
normalizes existing table and function access and revokes automatic privileges
for future tables, sequences, and functions created by `postgres`.

References: [Supabase breaking-change notice](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
and [Securing your API](https://supabase.com/docs/guides/api/securing-your-api).

PostgreSQL grants and RLS are separate layers. A grant makes an operation
reachable through PostgREST/GraphQL; an RLS policy then decides which rows that
operation may affect. A policy does not replace a grant, and a grant must not be
broader merely because RLS is enabled.

Every future `CREATE TABLE public...` migration must, in the same file:

1. enable RLS and add the required policies when the table is Data API-facing;
2. revoke inherited or legacy access explicitly:

   ```sql
   revoke all on table public.example from public, anon, authenticated, service_role;
   ```

3. grant only the evidenced operations to the roles that need them; a private
   table needs no subsequent grant;
4. explicitly address a sequence if the table uses `serial` or identity; and
5. explicitly revoke and regrant callable functions, especially SECURITY
   DEFINER functions.

Run the deterministic repository guard before committing:

```bash
npm run verify:supabase-privileges
```

The guard inventories all public table creation migrations, verifies that the
historical tables have a durable boundary, and rejects a new public table unless
its creating migration includes the four-role revoke above. The focused database
regression is `supabase/tests/data_api_privileges.sql`; `supabase test db` runs it
against a reset local Supabase database and the script rolls back.
