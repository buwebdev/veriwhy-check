/**
 * @file Unit and sandbox integration tests for transparent uninstallation.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { pathExists } from '../src/files.js';
import { uninstallApplication, uninstallPlan, windowsRemovalScript } from '../src/uninstall.js';
import { withFixture } from './helpers.js';

async function installation(root: string): Promise<{ data: string; launcher: string }> {
  const data = join(root, 'data');
  const launcher = join(root, 'bin', 'veriwhy-check');
  await mkdir(join(data, 'versions', '1.0.0'), { recursive: true });
  await mkdir(join(data, 'cache'), { recursive: true });
  await mkdir(join(data, 'reports'), { recursive: true });
  await mkdir(join(root, 'bin'), { recursive: true });
  await writeFile(launcher, 'launcher');
  await writeFile(join(data, 'reports', 'report.html'), 'report');
  await writeFile(join(data, 'install.json'), JSON.stringify({ schemaVersion: 1, activeVersion: '1.0.0', installRoot: data, launcher, installedAt: new Date().toISOString() }));
  return { data, launcher };
}

test('dry run lists application targets and preserves reports without changes', async () => {
  await withFixture('uninstall-preview', async (root) => {
    const { data, launcher } = await installation(root);
    const result = await uninstallApplication({ dataDirectory: data, dryRun: true });
    assert.equal(result.scheduled, false);
    assert.ok(result.removed.includes(launcher));
    assert.ok(await pathExists(launcher));
    assert.ok(await pathExists(join(data, 'reports', 'report.html')));
  });
});

test('uninstall removes application files but keeps reports by default', async () => {
  await withFixture('uninstall-keep', async (root) => {
    const { data, launcher } = await installation(root);
    await uninstallApplication({ dataDirectory: data, platform: 'darwin' });
    assert.equal(await pathExists(launcher), false);
    assert.equal(await pathExists(join(data, 'versions')), false);
    assert.equal(await pathExists(join(data, 'install.json')), false);
    assert.equal(await readFile(join(data, 'reports', 'report.html'), 'utf8'), 'report');
  });
});

test('explicit report removal and invalid records follow safe boundaries', async () => {
  await withFixture('uninstall-reports', async (root) => {
    const { data } = await installation(root);
    await uninstallApplication({ dataDirectory: data, removeReports: true, platform: 'darwin' });
    assert.equal(await pathExists(join(data, 'reports')), false);
    await assert.rejects(uninstallPlan({ dataDirectory: data }), /No VeriWhy Check installation record/);
    await writeFile(join(data, 'install.json'), JSON.stringify({ installRoot: root, launcher: join(root, 'bin', 'x') }));
    await assert.rejects(uninstallPlan({ dataDirectory: data }), /does not match/);
  });
});

test('uninstaller refuses a filesystem root or home directory as its data folder', async () => {
  await assert.rejects(uninstallPlan({ dataDirectory: '/' }), /too broad/);
  if (process.env.HOME) await assert.rejects(uninstallPlan({ dataDirectory: process.env.HOME }), /too broad/);
});

test('Windows deferred cleanup waits and retries files that remain briefly locked', () => {
  const source = windowsRemovalScript([`C:\\Program Files\\VeriWhy Check\\veriwhy-check.cmd`, `C:\\Users\\Student's Data`], 2468);
  assert.match(source, /Wait-Process -Id 2468/);
  assert.match(source, /attempt -lt 80/);
  assert.match(source, /Start-Sleep -Milliseconds 250/);
  assert.match(source, /Student''s Data/);
});
