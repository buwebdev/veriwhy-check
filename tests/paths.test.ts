/**
 * @file Unit tests for cross-platform storage-path selection.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { browserCacheRoot, userDataRoot } from '../src/paths.js';

test('user data roots follow documented platform conventions', () => {
  assert.equal(userDataRoot('darwin', { VERIWHY_CHECK_DATA_ROOT: '/custom/data' }, '/student'), '/custom/data');
  assert.equal(userDataRoot('darwin', {}, '/student'), join('/student', 'Library', 'Application Support', 'VeriWhy Check'));
  assert.equal(userDataRoot('win32', { LOCALAPPDATA: 'C:\\StudentData' }, 'C:\\Users\\Student'), join('C:\\StudentData', 'VeriWhy Check'));
  assert.equal(userDataRoot('linux', { XDG_DATA_HOME: '/student/data' }, '/student'), join('/student/data', 'veriwhy-check'));
  assert.equal(userDataRoot('win32', {}, 'C:\\Users\\Student'), join('C:\\Users\\Student', 'AppData', 'Local', 'VeriWhy Check'));
  assert.equal(userDataRoot('linux', {}, '/student'), join('/student', '.local', 'share', 'veriwhy-check'));
});

test('browser cache respects an explicit Playwright location', () => {
  assert.equal(browserCacheRoot('linux', { PLAYWRIGHT_BROWSERS_PATH: '/managed/browser' }, '/student'), '/managed/browser');
  assert.equal(browserCacheRoot('darwin', {}, '/student'), join('/student', 'Library', 'Caches', 'ms-playwright'));
  assert.match(browserCacheRoot('linux', { PLAYWRIGHT_BROWSERS_PATH: '0' }, '/student'), /playwright-core/);
  assert.equal(browserCacheRoot('win32', { LOCALAPPDATA: 'C:\\Data' }, 'C:\\Student'), join('C:\\Data', 'ms-playwright'));
  assert.equal(browserCacheRoot('linux', {}, '/student'), join('/student', '.cache', 'ms-playwright'));
});
