/**
 * @file Unit tests for manual release argument, version, and safety rules.
 * @author Richard Krasso
 *
 * Release helper tests keep semantic-version choices, clean-tree policy, remote
 * builder names, and the six required assets deterministic before deployment
 * code performs any Git or GitHub operation.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  missingReleaseAssets,
  nextReleaseVersion,
  nonMarkdownChanges,
  parseReleaseMode,
  remoteReleaseWorkflows,
  requiredReleaseAssets
} from '../src/release.js';

test('manual releases require one clear release type', () => {
  assert.equal(parseReleaseMode(['current']), 'current');
  assert.equal(parseReleaseMode(['patch']), 'patch');
  assert.throws(() => parseReleaseMode([]), /Choose one release type/);
  assert.throws(() => parseReleaseMode(['patch', 'major']), /Choose one release type/);
  assert.throws(() => parseReleaseMode(['latest']), /Choose one release type/);
});

test('release versions follow stable semantic-version boundaries', () => {
  assert.equal(nextReleaseVersion('1.2.3', 'current'), '1.2.3');
  assert.equal(nextReleaseVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(nextReleaseVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(nextReleaseVersion('1.2.3', 'major'), '2.0.0');
  assert.throws(() => nextReleaseVersion('1.2.3-beta.1', 'patch'), /stable versions only/);
});

test('automatic release commits accept Markdown but identify other changes', () => {
  assert.deepEqual(nonMarkdownChanges(['README.md', 'docs/guide/01-welcome.MD']), []);
  assert.deepEqual(nonMarkdownChanges(['README.md', 'src/cli.ts', 'package.json', 'src/cli.ts']), [
    'package.json',
    'src/cli.ts'
  ]);
});

test('complete releases require every supported platform archive and digest', () => {
  const required = requiredReleaseAssets();
  assert.equal(required.length, 6);
  assert.deepEqual(missingReleaseAssets(required), []);
  assert.deepEqual(missingReleaseAssets(required.slice(0, -2)), [
    'veriwhy-check-windows-x64.tar.gz',
    'veriwhy-check-windows-x64.tar.gz.sha256'
  ]);
  assert.deepEqual(remoteReleaseWorkflows, [
    'manual-macos-intel-release.yml',
    'manual-windows-release.yml'
  ]);
});
