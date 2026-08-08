/**
 * @file Unit tests for the strict public-profile schema.
 * @author Richard Krasso
 *
 * The profile suite treats YAML as executable configuration and probes both the
 * valid schema and every important rejection boundary. Malformed keys, paths,
 * patterns, commands, aliases, and identifiers must fail before student work is
 * inspected.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProfileSource } from '../src/profile.js';

const validProfile = `
id: WEB-330/assignment-1.3
course: WEB 330
assignment: Timer
version: 1.0.0
project:
  kind: static-web
  entry: project08-01.html
  locate: [project08-01_txt.html]
requirements:
  - id: required-files
    label: Required files are present
    rules:
      - kind: file-groups
        groups:
          - [project08-01.html, project08-01_txt.html]
  - id: timer-behavior
    label: Timer behavior works
    rules:
      - kind: browser
        test: WEB-330/project8-1
        case: countdown
        timeoutSeconds: 20
`;

test('valid profile source produces a typed public contract', () => {
  const profile = parseProfileSource('WEB-330/assignment-1.3', validProfile);
  assert.equal(profile.project.kind, 'static-web');
  assert.equal(profile.requirements.length, 2);
  assert.equal(profile.requirements[1]?.rules[0]?.kind, 'browser');
});

test('profile parser rejects unknown keys, duplicate ids, and traversal', () => {
  assert.throws(
    () =>
      parseProfileSource(
        'WEB-330/assignment-1.3',
        validProfile.replace('version: 1.0.0', 'version: 1.0.0\nsecret: true')
      ),
    /unsupported field/
  );
  assert.throws(
    () =>
      parseProfileSource(
        'WEB-330/assignment-1.3',
        validProfile.replace('id: timer-behavior', 'id: required-files')
      ),
    /duplicate requirement/
  );
  assert.throws(
    () =>
      parseProfileSource(
        'WEB-330/assignment-1.3',
        validProfile.replace('project08-01.html', '../project08-01.html')
      ),
    /relative paths/
  );
});

test('profile parser rejects arbitrary commands and invalid expressions', () => {
  const unsafeCommand = validProfile.replace(
    'kind: browser\n        test: WEB-330/project8-1\n        case: countdown\n        timeoutSeconds: 20',
    'kind: command\n        executable: bash\n        args: [run]\n        timeoutSeconds: 20'
  );
  assert.throws(
    () => parseProfileSource('WEB-330/assignment-1.3', unsafeCommand),
    /executable must be npm/
  );

  const sourceRule = validProfile.replace(
    'kind: browser\n        test: WEB-330/project8-1\n        case: countdown\n        timeoutSeconds: 20',
    "kind: source\n        roots: [.]\n        all: ['[invalid']"
  );
  assert.throws(
    () => parseProfileSource('WEB-330/assignment-1.3', sourceRule),
    /invalid regular expression/
  );
});

test('profile parser covers supported project and deterministic rule variants', () => {
  const nodeProfile = validProfile
    .replace(
      'kind: static-web\n  entry: project08-01.html\n  locate: [project08-01_txt.html]',
      'kind: node\n  entry: index.js\n  install: none'
    )
    .replace(
      'kind: browser\n        test: WEB-330/project8-1\n        case: countdown\n        timeoutSeconds: 20',
      'kind: node-test\n        test: WEB-340/sample\n        case: run\n        timeoutSeconds: 20'
    );
  assert.equal(parseProfileSource('WEB-330/assignment-1.3', nodeProfile).project.kind, 'node');

  const npmProfile = validProfile
    .replace(
      'kind: static-web\n  entry: project08-01.html\n  locate: [project08-01_txt.html]',
      'kind: npm\n  markers: [package.json, angular.json]\n  install: npm-ci'
    )
    .replace(
      'kind: browser\n        test: WEB-330/project8-1\n        case: countdown\n        timeoutSeconds: 20',
      'kind: command\n        executable: npm\n        args: [run, build]\n        timeoutSeconds: 120'
    );
  assert.equal(parseProfileSource('WEB-330/assignment-1.3', npmProfile).project.kind, 'npm');
});

test('profile parser explains malformed YAML and common schema mistakes', () => {
  assert.throws(() => parseProfileSource('../bad', validProfile), /Invalid profile id/);
  assert.throws(() => parseProfileSource('WEB-330/assignment-1.3', 'id: [broken'), /invalid YAML/);
  assert.throws(
    () => parseProfileSource('WEB-330/other', validProfile),
    /does not match requested/
  );
  assert.throws(
    () =>
      parseProfileSource(
        'WEB-330/assignment-1.3',
        validProfile.replace('version: 1.0.0', 'version: first')
      ),
    /semantic version/
  );
  assert.throws(
    () =>
      parseProfileSource(
        'WEB-330/assignment-1.3',
        validProfile.replace('timeoutSeconds: 20', 'timeoutSeconds: 0')
      ),
    /integer from 1/
  );
  assert.throws(
    () =>
      parseProfileSource(
        'WEB-330/assignment-1.3',
        validProfile.replace('case: countdown', 'case: Not Valid')
      ),
    /case must use lowercase/
  );
});

test('profile parser rejects empty, mistyped, and unsupported rule values', () => {
  const replaceBrowser = (replacement: string): string =>
    validProfile.replace(
      'kind: browser\n        test: WEB-330/project8-1\n        case: countdown\n        timeoutSeconds: 20',
      replacement
    );
  const invalidSources = [
    validProfile.replace('course: WEB 330', 'course: ""'),
    validProfile.replace('project:\n  kind: static-web', 'project: invalid'),
    validProfile.replace('kind: static-web', 'kind: unsupported'),
    validProfile.replace('locate: [project08-01_txt.html]', 'locate: [1]'),
    validProfile.replace(
      'kind: static-web\n  entry: project08-01.html\n  locate: [project08-01_txt.html]',
      'kind: npm\n  markers: []\n  install: npm-ci'
    ),
    validProfile.replace(
      'kind: static-web\n  entry: project08-01.html\n  locate: [project08-01_txt.html]',
      'kind: node\n  entry: index.js\n  install: always'
    ),
    replaceBrowser('kind: files\n        paths: []'),
    replaceBrowser('kind: file-groups\n        groups: []'),
    replaceBrowser('kind: file-groups\n        groups: [[]]'),
    replaceBrowser('kind: source\n        roots: [src]\n        all: []'),
    replaceBrowser('kind: test-count\n        minimum: -1'),
    replaceBrowser('kind: hygiene\n        forbidden: []'),
    replaceBrowser(
      'kind: command\n        executable: npm\n        args: []\n        timeoutSeconds: 20'
    ),
    replaceBrowser('kind: unsupported'),
    validProfile.replace('id: timer-behavior', 'id: Invalid ID'),
    validProfile.replace(
      'rules:\n      - kind: browser',
      'rules: []\n      # removed rule\n      # - kind: browser'
    )
  ];
  for (const source of invalidSources)
    assert.throws(() => parseProfileSource('WEB-330/assignment-1.3', source));
});
