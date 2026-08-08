/**
 * @file Unit tests for notification-safe managed-browser packaging.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  copyHeadlessBrowserRuntime,
  findMacAppBundles,
  headlessShellExecutablePath,
  releaseBrowserEntry
} from '../src/browser-runtime.js';

test('release browser selection includes only headless runtime directories', () => {
  assert.equal(releaseBrowserEntry('chromium_headless_shell-1234'), true);
  assert.equal(releaseBrowserEntry('ffmpeg-1011'), true);
  assert.equal(releaseBrowserEntry('chromium-1234'), false);
  assert.equal(releaseBrowserEntry('.links'), false);
});

test('headless shell discovery selects the newest available revision', async () => {
  const root = await mkdtemp(join(tmpdir(), 'veriwhy-browser-path-'));
  try {
    const older = join(root, 'chromium_headless_shell-99', 'shell');
    const newer = join(root, 'chromium_headless_shell-1234', 'shell');
    await mkdir(older, { recursive: true });
    await mkdir(newer, { recursive: true });
    await writeFile(join(older, 'chrome-headless-shell'), 'older');
    await writeFile(join(newer, 'chrome-headless-shell'), 'newer');
    assert.equal(headlessShellExecutablePath(root, 'darwin'), join(newer, 'chrome-headless-shell'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('release copy excludes Chrome app bundles and keeps the headless shell', async () => {
  const root = await mkdtemp(join(tmpdir(), 'veriwhy-browser-copy-'));
  const source = join(root, 'source');
  const destination = join(root, 'destination');
  try {
    const executable = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
    const shell = join(source, 'chromium_headless_shell-1234', 'shell');
    const chromeApp = join(source, 'chromium-1234', 'Google Chrome for Testing.app', 'Contents');
    const ffmpeg = join(source, 'ffmpeg-1011');
    await mkdir(shell, { recursive: true });
    await mkdir(chromeApp, { recursive: true });
    await mkdir(ffmpeg, { recursive: true });
    await writeFile(join(shell, executable), 'shell');
    await writeFile(join(chromeApp, 'Info.plist'), 'notifications');
    await writeFile(join(ffmpeg, 'ffmpeg'), 'ffmpeg');
    await copyHeadlessBrowserRuntime(source, destination);
    assert.match(headlessShellExecutablePath(destination), /chromium_headless_shell-1234/);
    assert.deepEqual(await findMacAppBundles(destination), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
