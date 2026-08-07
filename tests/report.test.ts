/**
 * @file Unit tests for accessible, escaped, local report output.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { escapeHtml, renderHtmlReport, writeReport } from '../src/report.js';
import type { CheckReport } from '../src/types.js';
import { withFixture } from './helpers.js';

function sampleReport(): CheckReport {
  return {
    schemaVersion: 1, runId: 'sample', generatedAt: '2026-08-07T00:00:00.000Z', projectName: 'project', projectPath: '/project',
    profile: { id: 'WEB-231/assignment-1.3', course: 'WEB 231', assignment: 'Variables', version: '1.0.0' },
    passed: 1, failed: 1, skipped: 1, complete: false,
    results: [
      { id: 'one', label: 'Present', status: 'pass', detail: 'Works.' },
      { id: 'two', label: '<Missing>', status: 'fail', detail: 'Fix & retry.' },
      { id: 'three', label: 'Skipped', status: 'skipped', detail: 'Not run.' }
    ], notices: ['Local only.']
  };
}

test('HTML escaping protects report structure and statuses use plain language', () => {
  assert.equal(escapeHtml('<&>"\''), '&lt;&amp;&gt;&quot;&#39;');
  const html = renderHtmlReport(sampleReport());
  assert.match(html, /Needs attention/);
  assert.match(html, /&lt;Missing&gt;/);
  assert.doesNotMatch(html, /<Missing>/);
  assert.match(html, /not your official course grade/);
});

test('report writer creates matching HTML and JSON files', async () => {
  await withFixture('report', async (root) => {
    const paths = await writeReport(sampleReport(), join(root, 'output'));
    assert.match(await readFile(paths.html, 'utf8'), /VeriWhy Check/);
    assert.equal(JSON.parse(await readFile(paths.json, 'utf8')).runId, 'sample');
  });
});
