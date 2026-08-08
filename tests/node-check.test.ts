/**
 * @file Unit tests for public Node.js check loading and isolation.
 * @author Richard Krasso
 *
 * Public Node-check tests prove named-case loading, timeout handling, useful
 * evidence, and private-path sanitization. Temporary modules make success and
 * failure deterministic without relying on course repositories.
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { cleanNodeCheckError, runNodeCheck, withTimeout } from '../src/node-check.js';
import { withFixture } from './helpers.js';

test('Node.js check runner loads named cases and sanitizes failures', async () => {
  await withFixture('node-check', async (root) => {
    const checks = join(root, 'checks');
    await mkdir(join(checks, 'WEB-340'), { recursive: true });
    await writeFile(
      join(checks, 'WEB-340', 'sample.mjs'),
      `
      export const cases = {
        passing: async (projectRoot) => \`Checked \${projectRoot.split('/').at(-1)}.\`,
        failing: async () => { throw new Error('Required output was missing.'); }
      };
    `
    );
    const passing = await runNodeCheck(root, 'WEB-340/sample', 'passing', 2, checks);
    assert.equal(passing.passed, true);
    const failing = await runNodeCheck(root, 'WEB-340/sample', 'failing', 2, checks);
    assert.equal(failing.passed, false);
    assert.match(failing.detail, /Required output/);
    const missing = await runNodeCheck(root, 'WEB-340/missing', 'case', 2, checks);
    assert.match(missing.detail, /unavailable/);
  });
});

test('timeout and error cleanup produce bounded learner-facing messages', async () => {
  await assert.rejects(withTimeout(new Promise(() => undefined), 0.01, 'Sample check'), /exceeded/);
  assert.equal(
    cleanNodeCheckError(new Error('/private/project failed'), '/private/project'),
    'selected project failed'
  );
});
