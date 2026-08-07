/**
 * @file Deterministic project discovery for course and weekly repository layouts.
 * @author Richard Krasso
 *
 * Students may keep one project at a repository root or organize projects by
 * course and week. Discovery searches a bounded depth, reports ambiguity, and
 * never guesses when two projects satisfy the selected profile contract.
 */

import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathExists } from './files.js';
import type { Profile, ProjectConfig } from './types.js';

/** Generated directories that cannot contain the student's selected project. */
const ignoredDirectories = new Set(['.angular', '.git', '.veriwhy-check', 'coverage', 'dist', 'node_modules', 'tmp']);

/** Recursively locate directories that contain every requested marker file. */
async function findMarkedDirectories(root: string, markers: string[], maxDepth: number): Promise<string[]> {
  const matches: string[] = [];
  async function visit(directory: string, depth: number): Promise<void> {
    if ((await Promise.all(markers.map((marker) => pathExists(join(directory, marker))))).every(Boolean)) {
      matches.push(directory);
    }
    if (depth >= maxDepth) return;
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith('.') || ignoredDirectories.has(entry.name)) continue;
      await visit(join(directory, entry.name), depth + 1);
    }
  }
  await visit(resolve(root), 0);
  return [...new Set(matches)].sort();
}

/** Translate a project configuration into the marker files used for discovery. */
export function projectMarkers(project: ProjectConfig): string[][] {
  if (project.kind === 'npm') return [project.markers];
  if (project.kind === 'node') return [[project.entry]];
  return [[project.entry], ...(project.locate ?? []).map((entry) => [entry])];
}

/** Find exactly one project or return a learner-friendly ambiguity explanation. */
export async function discoverProject(
  searchRoot: string,
  profile: Pick<Profile, 'id' | 'project'>,
  maxDepth = 4
): Promise<{ project?: string; candidates: string[]; message?: string }> {
  const candidateSets = await Promise.all(projectMarkers(profile.project).map((markers) =>
    findMarkedDirectories(searchRoot, markers, maxDepth)
  ));
  const candidates = [...new Set(candidateSets.flat())].sort();
  if (candidates.length === 1) return { project: candidates[0]!, candidates };
  if (candidates.length === 0) {
    return {
      candidates,
      message: `No project matching ${profile.id} was found within ${maxDepth} directory levels of ${resolve(searchRoot)}.`
    };
  }
  return {
    candidates,
    message: `Multiple projects matching ${profile.id} were found. Run the command again with --path set to one specific project.`
  };
}
