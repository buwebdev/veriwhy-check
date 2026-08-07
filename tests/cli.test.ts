/**
 * @file Unit tests for learner-facing CLI success and correction paths.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { commandError, isCliEntrypoint, resolveProfileInput, runCli, type CliEnvironment } from '../src/cli.js';

function capture(): { environment: CliEnvironment; output: string[]; errors: string[] } {
  const output: string[] = [];
  const errors: string[] = [];
  return { environment: { out: (value) => output.push(value), error: (value) => errors.push(value), cwd: () => process.cwd() }, output, errors };
}

test('help, version, paths, and profile list are understandable', async () => {
  for (const args of [[], ['version'], ['paths'], ['list', 'WEB-425']]) {
    const state = capture();
    assert.equal(await runCli(args, state.environment), 0);
    assert.equal(state.errors.length, 0);
    assert.ok(state.output.join('\n').length > 5);
  }
});

test('mistyped commands, missing assignment, extra values, and invalid flags explain the correction', async () => {
  for (const args of [['chekc'], ['check'], ['paths', 'extra'], ['list', 'WEB-425', 'extra'], ['check', 'WEB-425/lab-1.1', '--wrong']]) {
    const state = capture();
    assert.equal(await runCli(args, state.environment), 1);
    assert.match(state.errors.join('\n'), /Try this next:/);
    assert.match(state.errors.join('\n'), /veriwhy-check help/);
  }
  assert.match(commandError('Wrong.', 'veriwhy-check help').message, /Try this next/);
});

test('profile validation loads every YAML profile', async () => {
  const state = capture();
  assert.equal(await runCli(['profiles', 'validate'], state.environment), 0);
  assert.match(state.output[0]!, /Validated 24/);
});

test('doctor and unfiltered profile aliases provide useful output', async () => {
  for (const args of [['doctor'], ['list'], ['profiles']]) {
    const state = capture();
    const status = await runCli(args, state.environment);
    assert.ok(status === 0 || status === 1);
    assert.ok(state.output.length > 0);
  }
});

test('unknown courses and multiple folders are corrected before checking files', async () => {
  const unknown = capture();
  assert.equal(await runCli(['list', 'WEB-999'], unknown.environment), 1);
  assert.match(unknown.errors[0]!, /No assignments were found/);
  const folders = capture();
  assert.equal(await runCli(['check', 'WEB-425/lab-1.1', 'one', 'two'], folders.environment), 1);
  assert.match(folders.errors[0]!, /Enter only one folder/);
});

test('update rejects extra input before contacting the network', async () => {
  const state = capture();
  assert.equal(await runCli(['update', 'now'], state.environment), 1);
  assert.match(state.errors[0]!, /does not accept extra/);
  assert.match(state.errors[0]!, /veriwhy-check update/);
});

test('uninstall rejects unknown options before reading installation data', async () => {
  const state = capture();
  assert.equal(await runCli(['uninstall', '--delete-everything'], state.environment), 1);
  assert.match(state.errors[0]!, /Unsupported uninstall option/);
  assert.match(state.errors[0]!, /--dry-run/);
});

test('installed CLI entry paths work when parent folders contain spaces', () => {
  const entry = resolve(join('Application Support', 'app', 'cli.js'));
  assert.equal(isCliEntrypoint(entry, pathToFileURL(entry).href), true);
  assert.equal(isCliEntrypoint(undefined, pathToFileURL(entry).href), false);
  assert.equal(isCliEntrypoint(resolve('different', 'cli.js'), pathToFileURL(entry).href), false);
});

test('assignment input accepts case differences and suggests close mistakes', () => {
  const ids = ['WEB-425/lab-1.1', 'WEB-425/lab-2.1'];
  assert.equal(resolveProfileInput('web-425/LAB-1.1', ids).id, 'WEB-425/lab-1.1');
  assert.equal(resolveProfileInput('WEB-425/lab-1.2', ids).suggestion, 'WEB-425/lab-1.1');
  assert.deepEqual(resolveProfileInput('unknown', ids), {});
});

test('guide command rejects unsupported settings with a correct example', async () => {
  const state = capture();
  assert.equal(await runCli(['guide', '--online'], state.environment), 1);
  assert.match(state.errors[0]!, /accepts only the optional --path/);
  assert.match(state.errors[0]!, /veriwhy-check guide/);
});
