/**
 * @file Unit tests for privacy-conscious file utilities.
 * @author Richard Krasso
 *
 * File tests protect the selected-project privacy boundary. Fixtures include
 * generated folders, authored source, tests, and links so listing, reading,
 * copying, containment, and cleanup behavior can be reviewed independently.
 */

import assert from 'node:assert/strict';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import {
  copyProject,
  isInside,
  isSafeRelativePath,
  listFiles,
  pathExists,
  readSources
} from '../src/files.js';
import { withFixture } from './helpers.js';

test('safe relative path and containment checks reject traversal', () => {
  assert.equal(isSafeRelativePath('src/app.ts'), true);
  assert.equal(isSafeRelativePath('../secret.txt'), false);
  assert.equal(isSafeRelativePath('/absolute/file'), false);
  assert.equal(isSafeRelativePath('C:\\secret.txt'), false);
  assert.equal(isInside('/course/project', '/course/project/src/app.ts'), true);
  assert.equal(isInside('/course/project', '/course/other/app.ts'), false);
});

test('file listing and source reading exclude generated data and links', async () => {
  await withFixture('files-list', async (root) => {
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'node_modules', 'package'), { recursive: true });
    await writeFile(join(root, 'src', 'app.js'), 'export const answer = 42;');
    await writeFile(join(root, 'src', 'app.test.js'), 'test("answer", () => {});');
    await writeFile(join(root, 'node_modules', 'package', 'index.js'), 'private dependency');
    await symlink(join(root, 'src', 'app.js'), join(root, 'linked.js'));

    assert.deepEqual(await listFiles(root), ['src/app.js', 'src/app.test.js']);
    assert.match(await readSources(root, ['src']), /answer = 42/);
    assert.doesNotMatch(await readSources(root, ['src']), /test\("answer"/);
    assert.match(await readSources(root, ['src'], true), /test\("answer"/);
  });
});

test('project copying excludes dependencies while preserving authored files', async () => {
  await withFixture('files-copy', async (root) => {
    const source = join(root, 'source');
    const destination = join(root, 'copy');
    await mkdir(join(source, 'node_modules'), { recursive: true });
    await writeFile(join(source, 'app.js'), 'console.log("student work");');
    await writeFile(join(source, 'node_modules', 'dependency.js'), 'generated');

    await copyProject(source, destination);
    assert.equal(await pathExists(join(destination, 'app.js')), true);
    assert.equal(await pathExists(join(destination, 'node_modules')), false);
    assert.match(await readFile(join(destination, 'app.js'), 'utf8'), /student work/);
  });
});
