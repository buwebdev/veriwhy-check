/**
 * @file Unit tests for opening the bundled visual guide safely.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { guideOpenCommand, openGuide } from '../src/guide.js';

test('guide opening commands cover macOS, Windows, and Linux defaults', () => {
  assert.deepEqual(guideOpenCommand('/guide/index.html', 'darwin'), { executable: 'open', args: ['/guide/index.html'] });
  assert.deepEqual(guideOpenCommand('C:\\guide\\index.html', 'win32'), { executable: 'explorer.exe', args: ['C:\\guide\\index.html'] });
  assert.deepEqual(guideOpenCommand('/guide/index.html', 'linux'), { executable: 'xdg-open', args: ['/guide/index.html'] });
});

test('guide can report its path or open it with an injected system service', async () => {
  const resolvePath = async () => '/guide/index.html';
  const commands: string[] = [];
  const opener = async (executable: string, args: string[]) => { commands.push(executable, ...args); };
  assert.deepEqual(await openGuide(false, opener, 'darwin', resolvePath), { path: '/guide/index.html', opened: false });
  assert.deepEqual(await openGuide(true, opener, 'darwin', resolvePath), { path: '/guide/index.html', opened: true });
  assert.deepEqual(commands, ['open', '/guide/index.html']);
});

test('guide opening failure explains how to open the file manually', async () => {
  await assert.rejects(openGuide(true, async () => { throw new Error('blocked'); }, 'linux', async () => '/guide/index.html'), /Open this file in your browser/);
});
