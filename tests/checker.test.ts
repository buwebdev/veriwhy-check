/**
 * @file Unit and integration tests for safe project-check orchestration.
 * @author Richard Krasso
 *
 * The orchestration suite exercises discovery, disposable copying, preparation,
 * evaluation, reporting, and cleanup as one workflow. Assertions focus on the
 * privacy and report invariants visible at module boundaries.
 */

import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { checkProject, prepareProject, resolveBrowserEntry } from '../src/checker.js';
import type { Profile } from '../src/types.js';
import { withFixture } from './helpers.js';

const staticProfile: Profile = {
  id: 'sample/static',
  course: 'Sample',
  assignment: 'Static',
  version: '1.0.0',
  project: { kind: 'static-web', entry: 'index.html', locate: ['index_txt.html'] },
  requirements: [{ id: 'file', label: 'File', rules: [{ kind: 'files', paths: ['index.html'] }] }]
};

test('browser entry resolution accepts textbook fallback and static preparation changes nothing', async () => {
  await withFixture('checker-entry', async (root) => {
    await writeFile(join(root, 'index_txt.html'), '<h1>Fallback</h1>');
    assert.equal(await resolveBrowserEntry(root, staticProfile), 'index_txt.html');
    await prepareProject(root, staticProfile);
    assert.match(await readFile(join(root, 'index_txt.html'), 'utf8'), /Fallback/);
  });
});

test('static-only integration discovers a project and writes a local report', async () => {
  await withFixture('checker-run', async (root) => {
    const project = join(root, 'week-1');
    await mkdir(project);
    await writeFile(join(project, 'project01-02.html'), '<table><tbody></tbody></table>');
    await writeFile(join(project, 'project01-02.js'), '');
    const result = await checkProject('WEB-231/assignment-1.3', {
      searchPath: root,
      staticOnly: true,
      outputDirectory: join(root, 'report')
    });
    assert.equal(result.report.profile.id, 'WEB-231/assignment-1.3');
    assert.ok(result.report.skipped > 0);
    assert.match(await readFile(result.html, 'utf8'), /not your official course grade/);
  });
});

test('missing and ambiguous projects become safe learner-facing errors', async () => {
  await withFixture('checker-errors', async (root) => {
    await assert.rejects(
      checkProject('WEB-231/assignment-1.3', { searchPath: root, staticOnly: true }),
      /No project matching/
    );
    for (const folder of ['one', 'two']) {
      await mkdir(join(root, folder));
      await writeFile(join(root, folder, 'project01-02.html'), '');
    }
    await assert.rejects(
      checkProject('WEB-231/assignment-1.3', { searchPath: root, staticOnly: true }),
      /Multiple projects/
    );
  });
});

test('dependency preparation reports a corrective failure instead of a process trace', async () => {
  await withFixture('checker-install', async (root) => {
    const profile: Profile = {
      id: 'sample/node',
      course: 'Sample',
      assignment: 'Node',
      version: '1.0.0',
      project: { kind: 'node', entry: 'index.js', install: 'npm-ci' },
      requirements: [{ id: 'run', label: 'Runs', rules: [{ kind: 'files', paths: ['index.js'] }] }]
    };
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ name: 'broken', dependencies: { missing: '1.0.0' } })
    );
    await assert.rejects(prepareProject(root, profile), /dependencies could not be prepared/);
  });
});

test('Angular preparation injects the public check only into the prepared project', async () => {
  await withFixture('checker-angular', async (root) => {
    const profile: Profile = {
      id: 'WEB-425/lab-1.1',
      course: 'WEB 425 Angular with TypeScript',
      assignment: 'Lab',
      version: '1.0.0',
      project: { kind: 'npm', markers: ['package.json'], install: 'npm-ci' },
      requirements: [
        { id: 'build', label: 'Builds', rules: [{ kind: 'files', paths: ['package.json'] }] }
      ]
    };
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ name: 'empty', version: '1.0.0' })
    );
    await writeFile(
      join(root, 'package-lock.json'),
      JSON.stringify({
        name: 'empty',
        version: '1.0.0',
        lockfileVersion: 3,
        packages: { '': { name: 'empty', version: '1.0.0' } }
      })
    );
    await prepareProject(root, profile);
    assert.match(
      await readFile(join(root, 'src', 'app', 'veriwhy-check.public.spec.ts'), 'utf8'),
      /Richard Krasso/
    );
  });
});
