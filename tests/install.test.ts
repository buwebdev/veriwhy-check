/**
 * @file Unit and sandbox integration tests for versioned installations.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { installPayload, launcherName, launcherSource, validatePayload } from '../src/install.js';
import { withFixture } from './helpers.js';

async function makePayload(root: string): Promise<string> {
  const payload = join(root, 'payload');
  await mkdir(join(payload, 'runtime'), { recursive: true });
  await mkdir(join(payload, 'app', 'dist', 'src'), { recursive: true });
  await mkdir(join(payload, 'app', 'profiles'), { recursive: true });
  await mkdir(join(payload, 'app', 'public-checks'), { recursive: true });
  const nodeName = process.platform === 'win32' ? 'node.exe' : 'node';
  const npmName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await writeFile(join(payload, 'runtime', nodeName), 'runtime');
  await mkdir(join(payload, 'runtime', 'node_modules', 'npm', 'bin'), { recursive: true });
  await writeFile(join(payload, 'runtime', npmName), 'npm launcher');
  await writeFile(join(payload, 'runtime', 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'npm cli');
  if (process.platform !== 'win32') {
    await chmod(join(payload, 'runtime', nodeName), 0o755);
    await chmod(join(payload, 'runtime', npmName), 0o755);
  }
  await writeFile(join(payload, 'app', 'package.json'), JSON.stringify({ version: '1.2.3' }));
  await writeFile(join(payload, 'app', 'dist', 'src', 'cli.js'), 'console.log("ready")');
  return payload;
}

test('launcher names and sources cover Windows and Unix argument forwarding', () => {
  assert.equal(launcherName('win32'), 'veriwhy-check.cmd');
  assert.equal(launcherName('darwin'), 'veriwhy-check');
  assert.match(launcherSource('/Application Files/1.0.0', 'darwin'), /"\$@"/);
  assert.match(launcherSource('C:\\App Files\\1.0.0', 'win32'), /%\*/);
  assert.match(launcherSource('C:\\App Files\\1.0.0', 'win32'), /--dry-run/);
  assert.match(launcherSource('C:\\App Files\\1.0.0', 'win32'), /del "%~f0"/);
  assert.match(launcherSource('/Application Files/1.0.0', 'linux'), /PLAYWRIGHT_BROWSERS_PATH/);
  assert.match(launcherSource('/Application Files/versions/1.0.0', 'linux'), /VERIWHY_CHECK_DATA_ROOT/);
  assert.match(launcherSource('/Application Files/versions/1.0.0', 'linux'), /PATH=.*runtime/);
  assert.match(launcherSource('C:\\App Files\\versions\\1.0.0', 'win32'), /set "PATH=.*runtime;%PATH%"/);
});

test('incomplete payloads fail before installation', async () => {
  await withFixture('install-invalid', async (root) => {
    await assert.rejects(validatePayload(root), /release package is incomplete/);
  });
});

test('sandbox installation writes a version, launcher, and manifest', async () => {
  await withFixture('install-valid', async (root) => {
    const payload = await makePayload(root);
    const result = await installPayload(payload, join(root, 'data'), join(root, 'bin'), process.platform);
    assert.equal(result.activeVersion, '1.2.3');
    assert.match(await readFile(result.launcher, 'utf8'), /veriwhy-check|cli\.js/);
    const manifest = JSON.parse(await readFile(join(root, 'data', 'install.json'), 'utf8'));
    assert.equal(manifest.activeVersion, '1.2.3');
    // A repair install of the same version must stage and replace cleanly.
    const repaired = await installPayload(payload, join(root, 'data'), join(root, 'bin'), process.platform);
    assert.equal(repaired.activeVersion, '1.2.3');
  });
});
