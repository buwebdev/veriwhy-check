/**
 * @file Unit tests for beginner help and likely-command suggestions.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { editDistance, mainHelp, suggestCommand } from '../src/help.js';

test('command suggestions correct common student typing mistakes', () => {
  assert.equal(editDistance('chekc', 'check'), 2);
  assert.equal(suggestCommand('chekc'), 'check');
  assert.equal(suggestCommand('something-unrelated'), undefined);
});

test('main help gives a starting workflow, examples, and privacy statement', () => {
  const help = mainHelp();
  assert.match(help, /Start here:/);
  assert.match(help, /veriwhy-check check WEB-425\/lab-1\.1/);
  assert.match(help, /source code is not uploaded/i);
});
