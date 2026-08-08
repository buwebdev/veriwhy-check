/**
 * @file Unit tests for every deterministic requirement rule and status merge.
 * @author Richard Krasso
 *
 * The evaluator suite covers every public rule type and its status precedence.
 * Injected services separate deterministic decision logic from processes and
 * browsers, making false passes and skipped-behavior regressions visible.
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateRequirement, evaluateRule, type EvaluationServices } from '../src/evaluator.js';
import type { ExecutionResult, Rule } from '../src/types.js';
import { withFixture } from './helpers.js';

const passed: ExecutionResult = { passed: true, detail: 'Observed expected behavior.' };
const services: EvaluationServices = {
  browser: async () => passed,
  node: async () => passed,
  command: async () => passed
};

test('file, source, test-count, and hygiene rules distinguish present work', async () => {
  await withFixture('evaluate-static', async (root) => {
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'test'), { recursive: true });
    await writeFile(join(root, 'src', 'app.js'), 'export const route = "/classes";');
    await writeFile(join(root, 'test', 'app.test.js'), 'function testRoute() {}');

    const rules: Rule[] = [
      { kind: 'files', paths: ['src/app.js'] },
      { kind: 'file-groups', groups: [['app.js', 'src/app.js']] },
      { kind: 'source', roots: ['src'], all: ['route'], any: ['classes', 'courses'] },
      { kind: 'test-source', roots: ['test'], all: ['testRoute'] },
      { kind: 'test-count', minimum: 1 },
      { kind: 'hygiene', forbidden: ['dist'] }
    ];
    for (const rule of rules) {
      assert.equal(
        (await evaluateRule(root, rule, { runExecutableChecks: true }, services)).status,
        'pass'
      );
    }
    assert.equal(
      (
        await evaluateRule(
          root,
          { kind: 'files', paths: ['missing.js'] },
          { runExecutableChecks: true },
          services
        )
      ).status,
      'fail'
    );
    assert.equal(
      (
        await evaluateRule(
          root,
          { kind: 'source', roots: ['src'], all: ['not-present'] },
          { runExecutableChecks: true },
          services
        )
      ).status,
      'fail'
    );
  });
});

test('behavior services and requirement status merging honor skipped and failed work', async () => {
  await withFixture('evaluate-behavior', async (root) => {
    const browserRule: Rule = {
      kind: 'browser',
      test: 'WEB-231/sample',
      case: 'render',
      timeoutSeconds: 5
    };
    assert.equal(
      (await evaluateRule(root, browserRule, { runExecutableChecks: false })).status,
      'skipped'
    );
    assert.equal(
      (await evaluateRule(root, browserRule, { runExecutableChecks: true })).status,
      'fail'
    );
    assert.equal(
      (
        await evaluateRule(
          root,
          browserRule,
          { runExecutableChecks: true, browserEntry: 'index.html' },
          services
        )
      ).status,
      'pass'
    );
    assert.equal(
      (
        await evaluateRule(
          root,
          { kind: 'node-test', test: 'WEB-340/sample', case: 'run', timeoutSeconds: 5 },
          { runExecutableChecks: true },
          services
        )
      ).status,
      'pass'
    );
    assert.equal(
      (
        await evaluateRule(
          root,
          { kind: 'command', executable: 'npm', args: ['test'], timeoutSeconds: 5 },
          { runExecutableChecks: true },
          services
        )
      ).status,
      'pass'
    );

    const result = await evaluateRequirement(
      root,
      {
        id: 'combined',
        label: 'Combined behavior',
        rules: [{ kind: 'files', paths: ['missing.js'] }, browserRule]
      },
      { runExecutableChecks: false },
      services
    );
    assert.equal(result.status, 'fail');
    assert.match(result.detail, /Missing required file/);
  });
});
