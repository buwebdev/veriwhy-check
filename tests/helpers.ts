/**
 * @file Shared unit-test fixture helpers.
 * @author Richard Krasso
 *
 * Test artifacts are deliberately created beneath the ignored project `tmp`
 * directory so local validation never scatters files around the workspace.
 */

import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { developmentTmpRoot } from '../src/paths.js';

/** Run a test with a unique owned fixture directory and guaranteed cleanup. */
export async function withFixture<T>(
  name: string,
  operation: (root: string) => Promise<T>
): Promise<T> {
  await mkdir(developmentTmpRoot, { recursive: true });
  const root = await mkdtemp(join(developmentTmpRoot, `${name}-`));
  try {
    return await operation(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
