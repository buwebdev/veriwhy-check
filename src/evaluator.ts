/**
 * @file Deterministic evaluator for student-visible profile requirements.
 * @author Richard Krasso
 *
 * Every requirement joins its rules with logical AND. Services are injectable
 * so unit tests can prove evaluator decisions without launching real tools.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runBrowserCheck } from './browser-check.js';
import { listFiles, pathExists, readSources } from './files.js';
import { runNodeCheck } from './node-check.js';
import { runCommand } from './runner.js';
import type { ExecutionResult, Requirement, RequirementResult, Rule } from './types.js';

/** Runtime choices and discovered entry file supplied by the check orchestrator. */
export interface EvaluationOptions {
  runExecutableChecks: boolean;
  browserEntry?: string;
}

/** Injectable side-effect services used by behavior and command rules. */
export interface EvaluationServices {
  browser: typeof runBrowserCheck;
  node: typeof runNodeCheck;
  command: typeof runCommand;
}

/** Production services used unless a unit test supplies controlled doubles. */
const defaultServices: EvaluationServices = {
  browser: runBrowserCheck,
  node: runNodeCheck,
  command: runCommand
};

/** Match a profile expression with consistent multiline, case-insensitive flags. */
function regexMatches(source: string, pattern: string): boolean {
  // Profiles are validated before this point; compiling here keeps matching
  // stateless and prevents a global regular expression from retaining indexes.
  return new RegExp(pattern, 'ims').test(source);
}

/** Evaluate one deterministic rule and return its student-facing evidence. */
export async function evaluateRule(
  root: string,
  rule: Rule,
  options: EvaluationOptions,
  services: EvaluationServices = defaultServices
): Promise<{ status: RequirementResult['status']; detail: string }> {
  // File rules establish the minimum physical submission contract. They report
  // all missing paths at once so a student can correct them in one revision.
  if (rule.kind === 'files') {
    const present = await Promise.all(rule.paths.map((path) => pathExists(join(root, path))));
    const missing = rule.paths.filter((_path, index) => !present[index]);
    return missing.length
      ? { status: 'fail', detail: `Missing required file(s): ${missing.join(', ')}.` }
      : { status: 'pass', detail: `Found ${rule.paths.length} required file(s).` };
  }
  if (rule.kind === 'file-groups') {
    // Each group describes equivalent textbook filenames. One match per group
    // is sufficient, which supports the documented _txt rename fallback.
    const missing: string[][] = [];
    for (const group of rule.groups) {
      const exists = await Promise.all(group.map((path) => pathExists(join(root, path))));
      if (!exists.some(Boolean)) missing.push(group);
    }
    return missing.length
      ? {
          status: 'fail',
          detail: `Missing file alternative(s): ${missing.map((group) => group.join(' or ')).join('; ')}.`
        }
      : {
          status: 'pass',
          detail: `Found one accepted file from each of ${rule.groups.length} required group(s).`
        };
  }
  if (rule.kind === 'source' || rule.kind === 'test-source') {
    // Source evidence is deliberately shallow: it confirms a disclosed
    // construct exists but never awards points for spacing, naming, or style.
    const source = await readSources(root, rule.roots, rule.kind === 'test-source');
    const missing = (rule.all ?? []).filter((pattern) => !regexMatches(source, pattern));
    const alternativePassed =
      !rule.any || rule.any.some((pattern) => regexMatches(source, pattern));
    if (!missing.length && alternativePassed)
      return { status: 'pass', detail: 'Required implementation evidence found.' };
    return {
      status: 'fail',
      detail: [
        missing.length
          ? `${missing.length} required implementation pattern(s) were not found.`
          : '',
        !alternativePassed ? 'None of the accepted implementation alternatives was found.' : ''
      ]
        .filter(Boolean)
        .join(' ')
    };
  }
  if (rule.kind === 'test-count') {
    // Public checks are excluded from this count. Otherwise the checker could
    // accidentally give itself credit for tests the student did not author.
    const testFiles = (await listFiles(root)).filter(
      (file) => /\.(?:spec|test)\.(?:js|ts)$/.test(file) && !file.includes('veriwhy-check.public')
    );
    let count = 0;
    for (const file of testFiles) {
      const source = await readFile(join(root, file), 'utf8');
      count += (source.match(/\b(?:it|test)\s*\(|\bfunction\s+test[A-Z_$][\w$]*\s*\(/g) ?? [])
        .length;
    }
    return count >= rule.minimum
      ? { status: 'pass', detail: `Found ${count} student-authored test(s).` }
      : {
          status: 'fail',
          detail: `Found ${count} student-authored test(s); expected at least ${rule.minimum}.`
        };
  }
  if (rule.kind === 'hygiene') {
    // Hygiene protects submission portability by detecting generated folders;
    // it does not inspect indentation, comments, naming, or aesthetic style.
    const present = await Promise.all(rule.forbidden.map((path) => pathExists(join(root, path))));
    const found = rule.forbidden.filter((_path, index) => present[index]);
    return found.length
      ? { status: 'fail', detail: `Generated or excluded content is present: ${found.join(', ')}.` }
      : { status: 'pass', detail: 'No generated or excluded submission content was found.' };
  }
  if (!options.runExecutableChecks)
    return { status: 'skipped', detail: 'Executable behavior was skipped by --static-only.' };
  let result: ExecutionResult;
  // Executable rules are dispatched through typed services rather than profile
  // shell strings. This preserves the public configuration safety boundary.
  if (rule.kind === 'browser') {
    if (!options.browserEntry)
      return { status: 'fail', detail: 'The selected static entry page is unavailable.' };
    result = await services.browser(
      root,
      options.browserEntry,
      rule.test,
      rule.case,
      rule.timeoutSeconds
    );
  } else if (rule.kind === 'node-test') {
    result = await services.node(root, rule.test, rule.case, rule.timeoutSeconds);
  } else {
    result = await services.command(rule.executable, rule.args, root, rule.timeoutSeconds);
  }
  return { status: result.passed ? 'pass' : 'fail', detail: result.detail };
}

/** Evaluate every rule in one requirement and combine their statuses. */
export async function evaluateRequirement(
  root: string,
  requirement: Requirement,
  options: EvaluationOptions,
  services: EvaluationServices = defaultServices
): Promise<RequirementResult> {
  const ruleResults = [];
  // A requirement uses logical AND: every disclosed rule contributes evidence,
  // and one functional failure makes the complete requirement need attention.
  for (const rule of requirement.rules)
    ruleResults.push(await evaluateRule(root, rule, options, services));
  const status: RequirementResult['status'] = ruleResults.some((result) => result.status === 'fail')
    ? 'fail'
    : ruleResults.some((result) => result.status === 'skipped')
      ? 'skipped'
      : 'pass';
  // Failure takes precedence over skipped work because the report should lead
  // with an observed defect whenever one is available.
  return {
    id: requirement.id,
    label: requirement.label,
    status,
    detail: ruleResults.map(({ detail }) => detail).join(' ')
  };
}
