/**
 * @file Unit tests for bounded and unambiguous project discovery.
 * @author Richard Krasso
 */

import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { discoverProject, projectMarkers } from '../src/discovery.js';
import type { Profile } from '../src/types.js';
import { withFixture } from './helpers.js';

const staticProfile: Pick<Profile, 'id' | 'project'> = {
  id: 'WEB-330/assignment-1.3',
  project: { kind: 'static-web', entry: 'project08-01.html', locate: ['project08-01_txt.html'] }
};

test('project markers include canonical and textbook filenames', () => {
  assert.deepEqual(projectMarkers(staticProfile.project), [['project08-01.html'], ['project08-01_txt.html']]);
  assert.deepEqual(projectMarkers({ kind: 'npm', markers: ['package.json', 'angular.json'], install: 'npm-ci' }), [['package.json', 'angular.json']]);
});

test('discovery finds nested weekly projects and textbook alternatives', async () => {
  await withFixture('discover-one', async (root) => {
    const project = join(root, 'web-330', 'week-1', 'project8-1');
    await mkdir(project, { recursive: true });
    await writeFile(join(project, 'project08-01_txt.html'), '<!doctype html>');
    const result = await discoverProject(root, staticProfile);
    assert.equal(result.project, project);
    assert.deepEqual(result.candidates, [project]);
  });
});

test('discovery reports missing and ambiguous projects without guessing', async () => {
  await withFixture('discover-many', async (root) => {
    const missing = await discoverProject(root, staticProfile);
    assert.match(missing.message ?? '', /No project matching/);

    for (const folder of ['current', 'backup']) {
      const project = join(root, folder);
      await mkdir(project);
      await writeFile(join(project, 'project08-01.html'), '<!doctype html>');
    }
    const ambiguous = await discoverProject(root, staticProfile);
    assert.equal(ambiguous.candidates.length, 2);
    assert.match(ambiguous.message ?? '', /Multiple projects/);
  });
});
