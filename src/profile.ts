/**
 * @file Strict YAML parser and validator for public assessment profiles.
 * @author Richard Krasso
 *
 * Profiles are executable configuration, so this parser rejects unknown keys,
 * aliases, unsafe paths, arbitrary executables, invalid regular expressions,
 * and ambiguous requirement identifiers before any project is inspected.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';
import { isSafeRelativePath, listFiles, pathExists } from './files.js';
import { profilesRoot } from './paths.js';
import type { Profile, ProjectConfig, Requirement, Rule } from './types.js';

/** Narrow unknown YAML values to ordinary key-value mappings. */
function record(value: unknown): value is Record<string, unknown> {
  // Arrays are objects in JavaScript, so they must be excluded explicitly to
  // prevent a YAML sequence from masquerading as a schema mapping.
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reject misspelled or unsupported keys rather than silently ignoring them. */
function assertKeys(value: Record<string, unknown>, allowed: string[], field: string): void {
  // Strict keys turn typographical errors into immediate maintainer feedback.
  // Silently dropping a misspelled rule could create a false student pass.
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length)
    throw new Error(`${field} contains unsupported field(s): ${unknown.join(', ')}.`);
}

/** Parse a required nonempty string. */
function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${field} must be a nonempty string.`);
  return value;
}

/** Parse a homogeneous list of strings. */
function strings(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${field} must be a list of strings.`);
  }
  return value;
}

/** Parse and constrain project-relative paths. */
function safePaths(value: unknown, field: string): string[] {
  const paths = strings(value, field);
  if (paths.some((path) => !isSafeRelativePath(path))) {
    // Profiles are public configuration but still cross a trust boundary. No
    // profile may inspect a parent folder or select an absolute student path.
    throw new Error(`${field} must contain only relative paths inside the selected project.`);
  }
  return paths;
}

/** Parse one project-relative path. */
function safePath(value: unknown, field: string): string {
  return safePaths([requiredString(value, field)], field)[0]!;
}

/** Parse the project discovery and dependency-installation contract. */
function parseProject(value: unknown): ProjectConfig {
  if (!record(value)) throw new Error('project must be a mapping.');
  const kind = requiredString(value.kind, 'project.kind');
  if (kind === 'static-web') {
    // Static projects are located by an entry page and need no dependency step.
    assertKeys(value, ['kind', 'entry', 'locate'], 'project');
    const locate =
      value.locate === undefined ? undefined : safePaths(value.locate, 'project.locate');
    return {
      kind,
      entry: safePath(value.entry, 'project.entry'),
      ...(locate?.length ? { locate } : {})
    };
  }
  if (kind === 'node') {
    // A Node entry file supports early courses that do not yet use package.json.
    assertKeys(value, ['kind', 'entry', 'install'], 'project');
    const install = value.install ?? 'none';
    if (install !== 'none' && install !== 'npm-ci')
      throw new Error('project.install must be none or npm-ci.');
    return { kind, entry: safePath(value.entry, 'project.entry'), install };
  }
  if (kind === 'npm') {
    // NPM projects use one or more markers because Angular and Node course
    // structures differ while sharing the same locked-install workflow.
    assertKeys(value, ['kind', 'markers', 'install'], 'project');
    const markers =
      value.markers === undefined ? ['package.json'] : safePaths(value.markers, 'project.markers');
    if (!markers.length) throw new Error('project.markers must not be empty.');
    const install = value.install ?? 'npm-ci';
    if (install !== 'none' && install !== 'npm-ci')
      throw new Error('project.install must be none or npm-ci.');
    return { kind, markers, install };
  }
  throw new Error(`project.kind is unsupported: ${kind}.`);
}

/** Parse a bounded timeout used by browser or Node behavior checks. */
function timeout(value: unknown, field: string, maximum: number): number {
  // Upper bounds prevent a malformed profile from keeping a student's machine
  // occupied indefinitely. The larger command ceiling allows npm builds.
  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > maximum) {
    throw new Error(`${field} must be an integer from 1 through ${maximum}.`);
  }
  return seconds;
}

/** Parse a public check module and case identifier. */
function behaviorRule(
  value: Record<string, unknown>,
  field: string,
  kind: 'browser' | 'node-test'
): Rule {
  assertKeys(value, ['kind', 'test', 'case', 'timeoutSeconds'], field);
  const test = safePath(value.test, `${field}.test`);
  // A second character allowlist limits public module names even after the
  // general path-containment validation has succeeded.
  if (!/^[A-Za-z0-9._/-]+$/.test(test))
    throw new Error(`${field}.test contains unsupported characters.`);
  const caseName = requiredString(value.case, `${field}.case`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(caseName))
    throw new Error(`${field}.case must use lowercase letters, numbers, and hyphens.`);
  return {
    kind,
    test,
    case: caseName,
    timeoutSeconds: timeout(value.timeoutSeconds, `${field}.timeoutSeconds`, 120)
  };
}

/** Parse one deterministic public rule. */
function parseRule(value: unknown, field: string): Rule {
  if (!record(value)) throw new Error(`${field} must be a mapping.`);
  const kind = requiredString(value.kind, `${field}.kind`);
  if (kind === 'files') {
    assertKeys(value, ['kind', 'paths'], field);
    const paths = safePaths(value.paths, `${field}.paths`);
    if (!paths.length) throw new Error(`${field}.paths must not be empty.`);
    return { kind, paths };
  }
  if (kind === 'file-groups') {
    assertKeys(value, ['kind', 'groups'], field);
    if (!Array.isArray(value.groups) || !value.groups.length)
      throw new Error(`${field}.groups must be a nonempty list.`);
    const groups = value.groups.map((group, index) =>
      safePaths(group, `${field}.groups[${index}]`)
    );
    if (groups.some((group) => !group.length))
      throw new Error(`${field}.groups cannot contain an empty group.`);
    return { kind, groups };
  }
  if (kind === 'source' || kind === 'test-source') {
    // Regular expressions are compiled during validation so a broken profile
    // fails the maintainer's linter rather than a student's assignment check.
    assertKeys(value, ['kind', 'roots', 'all', 'any'], field);
    const roots = safePaths(value.roots, `${field}.roots`);
    const all = value.all === undefined ? undefined : strings(value.all, `${field}.all`);
    const any = value.any === undefined ? undefined : strings(value.any, `${field}.any`);
    if (!roots.length || !(all?.length || any?.length))
      throw new Error(`${field} requires roots and at least one pattern.`);
    for (const pattern of [...(all ?? []), ...(any ?? [])]) {
      try {
        new RegExp(pattern, 'ims');
      } catch {
        throw new Error(`${field} contains an invalid regular expression: ${pattern}.`);
      }
    }
    return { kind, roots, ...(all ? { all } : {}), ...(any ? { any } : {}) };
  }
  if (kind === 'test-count') {
    assertKeys(value, ['kind', 'minimum'], field);
    if (!Number.isInteger(value.minimum) || Number(value.minimum) < 0)
      throw new Error(`${field}.minimum must be a nonnegative integer.`);
    return { kind, minimum: Number(value.minimum) };
  }
  if (kind === 'hygiene') {
    assertKeys(value, ['kind', 'forbidden'], field);
    const forbidden = safePaths(value.forbidden, `${field}.forbidden`);
    if (!forbidden.length) throw new Error(`${field}.forbidden must not be empty.`);
    return { kind, forbidden };
  }
  if (kind === 'browser' || kind === 'node-test') return behaviorRule(value, field, kind);
  if (kind === 'command') {
    // Version 1 permits only npm as a general command. Profiles cannot introduce
    // arbitrary shells or executables despite being readable configuration.
    assertKeys(value, ['kind', 'executable', 'args', 'timeoutSeconds'], field);
    if (value.executable !== 'npm') throw new Error(`${field}.executable must be npm.`);
    const args = strings(value.args, `${field}.args`);
    if (!args.length) throw new Error(`${field}.args must not be empty.`);
    return {
      kind,
      executable: 'npm',
      args,
      timeoutSeconds: timeout(value.timeoutSeconds, `${field}.timeoutSeconds`, 600)
    };
  }
  throw new Error(`${field}.kind is unsupported: ${kind}.`);
}

/** Parse one student-visible requirement. */
function parseRequirement(value: unknown, index: number): Requirement {
  const field = `requirements[${index}]`;
  if (!record(value)) throw new Error(`${field} must be a mapping.`);
  assertKeys(value, ['id', 'label', 'rules'], field);
  const id = requiredString(value.id, `${field}.id`);
  // Stable lowercase identifiers become report keys and should remain portable
  // across case-sensitive and case-insensitive operating systems.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id))
    throw new Error(`${field}.id must use lowercase letters, numbers, and hyphens.`);
  if (!Array.isArray(value.rules) || !value.rules.length)
    throw new Error(`${field}.rules must be a nonempty list.`);
  return {
    id,
    label: requiredString(value.label, `${field}.label`),
    rules: value.rules.map((item, ruleIndex) => parseRule(item, `${field}.rules[${ruleIndex}]`))
  };
}

/** Validate a parsed YAML value against the complete public profile schema. */
function validateProfile(value: unknown, requestedId: string): Profile {
  if (!record(value)) throw new Error('Profile root must be a mapping.');
  assertKeys(
    value,
    ['id', 'course', 'assignment', 'version', 'project', 'requirements'],
    'profile'
  );
  const id = requiredString(value.id, 'profile.id');
  if (id !== requestedId)
    throw new Error(`Profile id ${id} does not match requested id ${requestedId}.`);
  const version = requiredString(value.version, 'profile.version');
  if (!/^\d+\.\d+\.\d+$/.test(version))
    throw new Error('profile.version must use semantic version form, such as 1.0.0.');
  if (!Array.isArray(value.requirements) || !value.requirements.length)
    throw new Error('profile.requirements must be a nonempty list.');
  const requirements = value.requirements.map(parseRequirement);
  if (
    new Set(requirements.map(({ id: requirementId }) => requirementId)).size !== requirements.length
  ) {
    throw new Error(`Profile ${id} contains duplicate requirement ids.`);
  }
  return {
    id,
    course: requiredString(value.course, 'profile.course'),
    assignment: requiredString(value.assignment, 'profile.assignment'),
    version,
    project: parseProject(value.project),
    requirements
  };
}

/** Parse profile YAML supplied by either a file or a unit test. */
export function parseProfileSource(id: string, source: string): Profile {
  if (!/^[A-Za-z0-9._/-]+$/.test(id) || id.includes('..'))
    throw new Error(`Invalid profile id: ${id}.`);
  const document = parseDocument(source, { schema: 'core', strict: true, uniqueKeys: true });
  if (document.errors.length) {
    throw new Error(
      `Profile ${id} is invalid YAML: ${document.errors.map(({ message }) => message).join('; ')}`
    );
  }
  return validateProfile(document.toJS({ maxAliasCount: 0 }), id);
}

/** Load and validate one bundled public profile. */
export async function loadProfile(id: string): Promise<Profile> {
  const path = join(profilesRoot, `${id}.yaml`);
  try {
    return parseProfileSource(id, await readFile(path, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new Error(`Profile not found: ${id}.`);
    throw error;
  }
}

/** List all bundled profile identifiers in stable course order. */
export async function listProfileIds(): Promise<string[]> {
  if (!(await pathExists(profilesRoot))) return [];
  return (await listFiles(profilesRoot))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => file.slice(0, -'.yaml'.length))
    .sort();
}
