/**
 * @file Unit tests for the loopback static server and browser-check boundaries.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { cleanBrowserError, closeStaticServer, runBrowserCheck, startStaticServer } from '../src/browser-check.js';
import { withFixture } from './helpers.js';

test('static server exposes project files and blocks traversal', async (context) => {
  try {
    await withFixture('browser-server', async (root) => {
    await writeFile(join(root, 'index.html'), '<h1>Student page</h1>');
    const { server, origin } = await startStaticServer(root, 'index.html');
    try {
      const page = await fetch(`${origin}/`);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /Student page/);
      const traversal = await fetch(`${origin}/..%2F..%2Fetc%2Fpasswd`);
      assert.equal(traversal.status, 404);
    } finally {
      await closeStaticServer(server);
    }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EPERM') {
      context.skip('The execution sandbox does not permit loopback listeners.');
      return;
    }
    throw error;
  }
});

test('browser runner identifies missing entry and check modules before launch', async () => {
  await withFixture('browser-missing', async (root) => {
    const missingEntry = await runBrowserCheck(root, 'missing.html', 'WEB-231/sample', 'case', 2, root);
    assert.match(missingEntry.detail, /Missing required entry/);
    await writeFile(join(root, 'index.html'), '<h1>Page</h1>');
    const missingCheck = await runBrowserCheck(root, 'index.html', 'WEB-231/sample', 'case', 2, root);
    assert.match(missingCheck.detail, /unavailable/);
    assert.equal(cleanBrowserError(new Error(`${root}/index.html failed`), root), 'selected project/index.html failed');
  });
});

test('managed browser executes public passing and failing behavior cases', async (context) => {
  try {
    await withFixture('browser-behavior', async (root) => {
      const checks = join(root, 'checks');
      await mkdir(checks);
      await writeFile(join(root, 'index.html'), '<button id="save">Save</button>');
      await writeFile(join(checks, 'sample.mjs'), `export const cases = {
        passing: async (page) => page.locator('#save').textContent(),
        failing: async () => { throw new Error('Expected a working control.'); }
      };`);
      const passing = await runBrowserCheck(root, 'index.html', 'sample', 'passing', 10, checks);
      if (!passing.passed && /operation not permitted|EPERM/i.test(passing.detail)) {
        context.skip('The execution sandbox does not permit loopback listeners.');
        return;
      }
      assert.equal(passing.passed, true);
      assert.equal(passing.detail, 'Save');
      const failing = await runBrowserCheck(root, 'index.html', 'sample', 'failing', 10, checks);
      assert.equal(failing.passed, false);
      assert.match(failing.detail, /Expected a working control/);
      const absent = await runBrowserCheck(root, 'index.html', 'sample', 'absent', 10, checks);
      assert.match(absent.detail, /case is unavailable/);
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EPERM') {
      context.skip('The execution sandbox does not permit loopback listeners.');
      return;
    }
    throw error;
  }
});
