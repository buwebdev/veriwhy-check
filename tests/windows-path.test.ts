/**
 * @file Unit tests for safe Windows user-PATH registration.
 * @author Richard Krasso
 *
 * Tests capture the prepared PowerShell process instead of touching the real
 * user environment. Native Windows release validation covers the registry and
 * fresh-shell behavior end to end.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addWindowsCommandPath,
  removeWindowsCommandPath,
  updateWindowsUserPath,
  windowsUserPathScript,
  type WindowsPathServices
} from '../src/windows-path.js';

test('add script preserves unrelated entries and appends one normalized directory', () => {
  const source = windowsUserPathScript('add');
  assert.match(source, /GetEnvironmentVariable\('Path', 'User'\)/);
  assert.match(source, /normalized -ine \$directory/);
  assert.match(source, /\$entries \+= \$directory/);
  assert.match(source, /SetEnvironmentVariable\('Path', \$updated, 'User'\)/);
  assert.match(source, /SendMessageTimeout/);
});

test('remove script omits only the matching directory without adding it again', () => {
  const source = windowsUserPathScript('remove');
  assert.match(source, /normalized -ine \$directory/);
  assert.doesNotMatch(source, /\$entries \+= \$directory/);
  assert.match(source, /\$updated = if \(\$entries\.Count -gt 0\)/);
});

test('Windows execution passes the command directory as data rather than source code', async () => {
  const calls: Array<{
    executable: string;
    arguments_: string[];
    environment: NodeJS.ProcessEnv;
  }> = [];
  const services: WindowsPathServices = {
    platform: 'win32',
    run: async (executable, arguments_, environment) => {
      calls.push({ executable, arguments_, environment });
    }
  };
  const directory = `C:\\Users\\Student O'Brien\\VeriWhy Check\\bin`;
  await updateWindowsUserPath(directory, 'add', services);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.executable, 'powershell.exe');
  assert.equal(calls[0]!.environment.VERIWHY_CHECK_COMMAND_DIRECTORY, directory);
  assert.equal(calls[0]!.arguments_.includes(directory), false);
  assert.ok(calls[0]!.arguments_.includes('-NonInteractive'));
});

test('non-Windows systems do not launch PowerShell and failures are explained', async () => {
  let runs = 0;
  await updateWindowsUserPath('unused', 'add', {
    platform: 'darwin',
    run: async () => {
      runs += 1;
    }
  });
  assert.equal(runs, 0);
  await addWindowsCommandPath('unused');
  await removeWindowsCommandPath('unused');

  await assert.rejects(
    updateWindowsUserPath('C:\\VeriWhy Check\\bin', 'remove', {
      platform: 'win32',
      run: async () => {
        throw new Error('registry denied');
      }
    }),
    /could not remove.*registry denied/
  );
});
