import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

await Promise.all([
  rm(resolve('dist'), { recursive: true, force: true }),
  rm(resolve('ios/App/App/public'), { recursive: true, force: true })
]);

console.log('Removed generated Vite and iOS web assets.');
execFileSync(npmCommand, ['run', 'build'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/verify-ios-content-bundle.mjs', '--dist-only'], { stdio: 'inherit' });
execFileSync(npxCommand, ['cap', 'sync', 'ios'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/verify-ios-content-bundle.mjs'], { stdio: 'inherit' });
