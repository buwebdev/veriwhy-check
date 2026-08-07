/**
 * @file Unit tests for shell-free process execution and output summarization.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { runCommand, summarizeCommandOutput } from '../src/runner.js';

test('command summarization favors useful error lines', () => {
  const detail = summarizeCommandOutput('noise\nERROR missing route\nnoise', false, 1, null);
  assert.equal(detail, 'ERROR missing route');
  assert.equal(summarizeCommandOutput('', true, 0, null), 'Command completed successfully.');
});

test('runner reports successful, failed, and timed-out processes', async () => {
  const success = await runCommand(process.execPath, ['-e', 'console.log("ok")'], process.cwd(), 5);
  assert.equal(success.passed, true);

  const failure = await runCommand(process.execPath, ['-e', 'console.error("Error: expected value"); process.exit(2)'], process.cwd(), 5);
  assert.equal(failure.passed, false);
  assert.match(failure.detail, /expected value/);

  const timeout = await runCommand(process.execPath, ['-e', 'setTimeout(() => {}, 5000)'], process.cwd(), 0.05);
  assert.equal(timeout.passed, false);
  assert.match(timeout.detail, /exceeded/);
});
