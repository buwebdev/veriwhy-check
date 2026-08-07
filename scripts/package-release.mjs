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
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { browserCacheRoot, packageRoot } from '../dist/src/paths.js';
import { releaseAssetName } from '../dist/src/update.js';

const run = promisify(execFile);
const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const releaseRoot = join(packageRoot, 'tmp', 'releases');
const stage = join(releaseRoot, 'stage');
const payload = join(stage, 'payload');
const app = join(payload, 'app');
const archive = join(releaseRoot, releaseAssetName());

await rm(stage, { recursive: true, force: true });
await mkdir(join(payload, 'runtime'), { recursive: true });
await mkdir(app, { recursive: true });

for (const directory of ['profiles', 'public-checks', 'docs']) {
  await cp(join(packageRoot, directory), join(app, directory), { recursive: true });
}
// Release packages need the compiled application, not compiled development
// tests. The complete tests remain available in the public source repository.
await mkdir(join(app, 'dist'), { recursive: true });
await cp(join(packageRoot, 'dist', 'src'), join(app, 'dist', 'src'), { recursive: true });
await cp(join(packageRoot, 'tmp', 'docs-site'), join(app, 'site'), { recursive: true });
for (const file of ['package.json', 'package-lock.json', 'README.md', 'LICENSE.md', 'THIRD_PARTY_NOTICES.md']) {
  await cp(join(packageRoot, file), join(app, file));
}
await cp(join(packageRoot, 'node_modules'), join(app, 'node_modules'), { recursive: true });
await run('npm', ['prune', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: app });
await cp(process.execPath, join(payload, 'runtime', process.platform === 'win32' ? 'node.exe' : 'node'));
await cp(browserCacheRoot(), join(payload, 'browsers'), { recursive: true });
await cp(join(packageRoot, 'scripts', 'install.mjs'), join(stage, 'install.mjs'));
await mkdir(releaseRoot, { recursive: true });
await rm(archive, { force: true });
await run('tar', ['-czf', archive, '-C', stage, 'install.mjs', 'payload']);
const digest = createHash('sha256').update(await readFile(archive)).digest('hex');
await writeFile(`${archive}.sha256`, `${digest}  ${basename(archive)}\n`, 'utf8');
console.log(`Created VeriWhy Check ${manifest.version}:`);
console.log(archive);
console.log(`${archive}.sha256`);
