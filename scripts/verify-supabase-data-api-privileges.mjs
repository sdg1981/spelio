import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const migrationsDirectory = path.resolve('supabase/migrations');
const legacyTableMigrations = new Set([
  '202605070001_admin_content_schema.sql',
  '202605070006_word_list_collections.sql',
  '202605150001_temporary_custom_word_lists.sql',
  '202607150001_mobile_typo_grace_aggregate_counters.sql'
]);
const requiredBoundaryRoles = new Set(['public', 'anon', 'authenticated', 'service_role']);

const migrationNames = (await readdir(migrationsDirectory))
  .filter(name => name.endsWith('.sql'))
  .sort();

const migrations = await Promise.all(migrationNames.map(async name => ({
  name,
  sql: await readFile(path.join(migrationsDirectory, name), 'utf8')
})));

const creations = [];
const revokeRolesByTable = new Map();
const errors = [];

for (const migration of migrations) {
  const normalized = stripSqlComments(migration.sql).replace(/\s+/g, ' ').trim();
  const createdInFile = [];

  for (const match of normalized.matchAll(/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z_][a-z0-9_]*)\b/gi)) {
    const table = match[1].toLowerCase();
    creations.push({ table, migration: migration.name });
    createdInFile.push(table);
  }

  const fileRevokes = collectTableBoundaryRevokes(normalized);
  for (const [table, roles] of fileRevokes) {
    const accumulated = revokeRolesByTable.get(table) ?? new Set();
    for (const role of roles) accumulated.add(role);
    revokeRolesByTable.set(table, accumulated);
  }

  if (!legacyTableMigrations.has(migration.name)) {
    for (const table of createdInFile) {
      const roles = fileRevokes.get(table) ?? new Set();
      const missing = [...requiredBoundaryRoles].filter(role => !roles.has(role));
      if (missing.length) {
        errors.push(`${migration.name}: public.${table} is created without a same-migration ` +
          `REVOKE ALL boundary for ${missing.join(', ')}`);
      }
    }
  }
}

for (const { table, migration } of creations) {
  const roles = revokeRolesByTable.get(table) ?? new Set();
  const missing = [...requiredBoundaryRoles].filter(role => !roles.has(role));
  if (missing.length) {
    errors.push(`${migration}: public.${table} has no durable privilege boundary for ${missing.join(', ')}`);
  }
}

if (errors.length) {
  console.error('Supabase Data API privilege verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Verified explicit Data API boundaries for ${creations.length} public tables across ${migrations.length} migrations.`);
}

function collectTableBoundaryRevokes(sql) {
  const revokes = new Map();
  const pattern = /\brevoke\s+all(?:\s+privileges)?\s+on\s+table\s+public\.([a-z_][a-z0-9_]*)\s+from\s+([^;]+);/gi;

  for (const match of sql.matchAll(pattern)) {
    const table = match[1].toLowerCase();
    const roles = revokes.get(table) ?? new Set();
    for (const rawRole of match[2].split(',')) {
      const role = rawRole.trim().replace(/^"|"$/g, '').toLowerCase();
      if (requiredBoundaryRoles.has(role)) roles.add(role);
    }
    revokes.set(table, roles);
  }

  return revokes;
}

function stripSqlComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\r\n]*/g, ' ');
}
