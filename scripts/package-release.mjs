#!/usr/bin/env node
/**
 * @file Build one self-contained platform release under the ignored tmp folder.
 * @author Richard Krasso
 *
 * The archive includes a private Node.js runtime, production dependencies,
 * public profiles and checks, documentation, and Playwright's managed browser.
 * It never writes outside this repository's ignored tmp/releases directory.
 */

import { createHash } from 'node:crypto';
import { access, chmod, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { browserCacheRoot, packageRoot } from '../dist/src/paths.js';
import { copyHeadlessBrowserRuntime } from '../dist/src/browser-runtime.js';
import { releaseAssetName } from '../dist/src/update.js';

const run = promisify(execFile);
// Every staging and archive path remains under ignored tmp/releases. Packaging
// can be repeated without altering maintained source or a user's installation.
const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const releaseRoot = join(packageRoot, 'tmp', 'releases');
const stage = join(releaseRoot, 'stage');
const payload = join(stage, 'payload');
const app = join(payload, 'app');
const archive = join(releaseRoot, releaseAssetName());

async function firstExisting(paths) {
  // NVM and GitHub runners place npm differently. Probe a small known list
  // instead of relying on an unrelated globally installed npm executable.
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {
      // Node distributions place npm differently on Unix and Windows.
    }
  }
  throw new Error(
    'The selected Node.js runtime does not include npm. Run nvm use and npm ci before packaging.'
  );
}

await rm(stage, { recursive: true, force: true });
// Rebuilding from an empty stage prevents a deleted source file from surviving
// in a new archive as stale release content.
await mkdir(join(payload, 'runtime'), { recursive: true });
await mkdir(app, { recursive: true });

for (const directory of ['profiles', 'public-checks', 'docs']) {
  // These readable assets are part of the transparent student contract and
  // remain available both in source control and in the offline package.
  await cp(join(packageRoot, directory), join(app, directory), { recursive: true });
}
// Release packages need the compiled application, not compiled development
// tests. The complete tests remain available in the public source repository.
await mkdir(join(app, 'dist'), { recursive: true });
await cp(join(packageRoot, 'dist', 'src'), join(app, 'dist', 'src'), { recursive: true });
await cp(join(packageRoot, 'tmp', 'docs-site'), join(app, 'site'), { recursive: true });
for (const file of [
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE.md',
  'THIRD_PARTY_NOTICES.md'
]) {
  await cp(join(packageRoot, file), join(app, file));
}
const npmSource = await firstExisting([
  resolve(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm'),
  join(dirname(process.execPath), 'node_modules', 'npm')
]);
await cp(join(packageRoot, 'node_modules'), join(app, 'node_modules'), { recursive: true });
// Prune only the copied dependency tree. The maintainer's local node_modules
// stays complete for TypeScript, tests, linting, and formatting.
await run(
  process.execPath,
  [
    join(npmSource, 'bin', 'npm-cli.js'),
    'prune',
    '--omit=dev',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund'
  ],
  { cwd: app }
);
await cp(
  process.execPath,
  join(payload, 'runtime', process.platform === 'win32' ? 'node.exe' : 'node')
);
// process.execPath is the NVM-selected Node 24 binary for this architecture;
// every supported platform therefore builds its own authentic runtime archive.
// A student must not need a system Node.js installation. Copy npm from the
// NVM-selected runtime and provide a small platform launcher beside Node.js.
await mkdir(join(payload, 'runtime', 'node_modules'), { recursive: true });
await cp(npmSource, join(payload, 'runtime', 'node_modules', 'npm'), { recursive: true });
if (process.platform === 'win32') {
  await writeFile(
    join(payload, 'runtime', 'npm.cmd'),
    '@echo off\r\n"%~dp0node.exe" "%~dp0node_modules\\npm\\bin\\npm-cli.js" %*\r\n'
  );
} else {
  const npmLauncher = join(payload, 'runtime', 'npm');
  await writeFile(
    npmLauncher,
    '#!/bin/sh\nruntime_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\nexec "$runtime_dir/node" "$runtime_dir/node_modules/npm/bin/npm-cli.js" "$@"\n'
  );
  await chmod(npmLauncher, 0o755);
}
// A full Google Chrome for Testing.app registers in macOS Notifications and
// would be duplicated by versioned installs. The headless shell provides the
// same rendering and automation capabilities without shipping an app bundle.
await copyHeadlessBrowserRuntime(browserCacheRoot(), join(payload, 'browsers'));
await cp(join(packageRoot, 'scripts', 'install.mjs'), join(stage, 'install.mjs'));
await mkdir(releaseRoot, { recursive: true });
await rm(archive, { force: true });
await run('tar', ['-czf', archive, '-C', stage, 'install.mjs', 'payload']);
// Hash the final compressed bytes so verification covers exactly what GitHub
// serves, including archive metadata and compression output.
const digest = createHash('sha256')
  .update(await readFile(archive))
  .digest('hex');
await writeFile(`${archive}.sha256`, `${digest}  ${basename(archive)}\n`, 'utf8');
console.log(`Created VeriWhy Check ${manifest.version}:`);
console.log(archive);
console.log(`${archive}.sha256`);
