import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const distDirectory = resolve('dist');
const iosPublicDirectory = resolve('ios/App/App/public');
const distOnly = process.argv.includes('--dist-only');
const expectedSupabaseUrl = process.env.IOS_EXPECTED_SUPABASE_URL
  ?? 'https://pybyqcmzattdmdxuhrtl.supabase.co';

const requiredFrontendMarkers = [
  'Learning Journeys',
  'Welsh Spelling Foundations',
  'Practice Library',
  'Explore useful spelling collections',
  'practice-library-card-grid',
  'foundation_patterns_d_dd',
  'practice_most_common_animals'
];

async function listFiles(directory, baseDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath, baseDirectory));
    } else if (entry.isFile()) {
      files.push(relative(baseDirectory, entryPath));
    }
  }

  return files.sort();
}

async function hashFile(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

function fail(message) {
  throw new Error(`iOS content bundle verification failed: ${message}`);
}

const capacitorConfigSource = await readFile(resolve('capacitor.config.ts'), 'utf8');
if (!/webDir:\s*['"]dist['"]/.test(capacitorConfigSource)) {
  fail('Capacitor must package the Vite dist directory.');
}
if (/\bserver\s*:/.test(capacitorConfigSource)) {
  fail('A remote Capacitor server configuration was found; this release check expects bundled assets.');
}

const distFiles = await listFiles(distDirectory);
const distJavaScriptFiles = distFiles.filter(file => extname(file) === '.js');
if (!distFiles.includes('index.html') || distJavaScriptFiles.length === 0) {
  fail('dist does not contain a completed Vite production build.');
}

const frontendJavaScript = (
  await Promise.all(distJavaScriptFiles.map(file => readFile(resolve(distDirectory, file), 'utf8')))
).join('\n');

for (const marker of requiredFrontendMarkers) {
  if (!frontendJavaScript.includes(marker)) {
    fail(`the production frontend is missing the current catalogue marker "${marker}".`);
  }
}

const escapedSupabaseUrl = expectedSupabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const configuredSupabasePattern = new RegExp(`${escapedSupabaseUrl}.{0,500}sb_publishable_`, 's');
if (!configuredSupabasePattern.test(frontendJavaScript)) {
  fail(`the compiled Supabase client does not target ${expectedSupabaseUrl}.`);
}

if (distOnly) {
  console.log('Verified current production Word Lists UI and live Supabase configuration in dist.');
  process.exit(0);
}

const iosFiles = await listFiles(iosPublicDirectory);
const allowedCapacitorFiles = new Set(['cordova.js', 'cordova_plugins.js']);
const unexpectedIosFiles = iosFiles.filter(file => !distFiles.includes(file) && !allowedCapacitorFiles.has(file));
if (unexpectedIosFiles.length > 0) {
  fail(`stale or unexpected iOS assets remain: ${unexpectedIosFiles.join(', ')}`);
}

for (const file of distFiles) {
  if (!iosFiles.includes(file)) {
    fail(`the iOS bundle is missing ${file}.`);
  }

  const [distHash, iosHash] = await Promise.all([
    hashFile(resolve(distDirectory, file)),
    hashFile(resolve(iosPublicDirectory, file))
  ]);
  if (distHash !== iosHash) {
    fail(`the iOS copy of ${file} does not match dist.`);
  }
}

console.log('Verified current Word Lists UI, production Supabase configuration, and exact iOS asset sync.');
