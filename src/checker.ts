/**
 * @file End-to-end orchestration for one safe student project check.
 * @author Richard Krasso
 *
 * This module discovers the project, copies authored files to an operating-
 * system temporary directory, prepares dependencies there, evaluates public
 * requirements, writes the durable report, and removes the temporary copy.
 */

import { copyFile, mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { discoverProject } from './discovery.js';
import { evaluateRequirement } from './evaluator.js';
import { copyProject, pathExists, removeOwnedPath } from './files.js';
import { publicChecksRoot, reportsRoot } from './paths.js';
import { loadProfile } from './profile.js';
import { writeReport } from './report.js';
import { runCommand } from './runner.js';
import type { CheckReport, Profile } from './types.js';

export interface CheckOptions {
  searchPath: string;
  staticOnly?: boolean;
  outputDirectory?: string;
}

/** Resolve the actual entry file, including a published textbook-name fallback. */
export async function resolveBrowserEntry(root: string, profile: Profile): Promise<string | undefined> {
  if (profile.project.kind !== 'static-web') return undefined;
  const candidates = [profile.project.entry, ...(profile.project.locate ?? [])];
  for (const candidate of candidates) if (await pathExists(join(root, candidate))) return candidate;
  return profile.project.entry;
}

/** Install dependencies only inside the disposable project copy when requested. */
export async function prepareProject(root: string, profile: Profile): Promise<void> {
  if (profile.project.kind === 'static-web' || profile.project.install === 'none') return;
  // Angular checks are public. Injecting the selected file into only the
  // disposable copy avoids changing the student's actual project.
  if (profile.course.startsWith('WEB 425')) {
    const publicTest = join(publicChecksRoot, 'angular', `${profile.id}.spec.ts`);
    if (await pathExists(publicTest)) {
      const destination = join(root, 'src', 'app', 'veriwhy-check.public.spec.ts');
      await mkdir(join(root, 'src', 'app'), { recursive: true });
      await copyFile(publicTest, destination);
    }
  }
  const result = await runCommand('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], root, 600);
  if (!result.passed) throw new Error(`The project dependencies could not be prepared. ${result.detail}`);
}

/** Execute one complete check and return the report plus its saved locations. */
export async function checkProject(profileId: string, options: CheckOptions): Promise<{ report: CheckReport; html: string; json: string }> {
  const profile = await loadProfile(profileId);
  const discovery = await discoverProject(resolve(options.searchPath), profile);
  if (!discovery.project) {
    const choices = discovery.candidates.length ? `\nFound:\n${discovery.candidates.map((path) => `  - ${path}`).join('\n')}` : '';
    throw new Error(`${discovery.message}${choices}`);
  }
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'veriwhy-check-'));
  const temporaryProject = join(temporaryRoot, 'project');
  try {
    await copyProject(discovery.project, temporaryProject);
    if (!options.staticOnly) await prepareProject(temporaryProject, profile);
    const browserEntry = await resolveBrowserEntry(temporaryProject, profile);
    const results = [];
    for (const requirement of profile.requirements) {
      results.push(await evaluateRequirement(temporaryProject, requirement, {
        runExecutableChecks: !options.staticOnly,
        ...(browserEntry ? { browserEntry } : {})
      }));
    }
    const passed = results.filter(({ status }) => status === 'pass').length;
    const failed = results.filter(({ status }) => status === 'fail').length;
    const skipped = results.filter(({ status }) => status === 'skipped').length;
    const report: CheckReport = {
      schemaVersion: 1,
      runId,
      generatedAt: new Date().toISOString(),
      projectName: basename(discovery.project),
      projectPath: discovery.project,
      profile: { id: profile.id, course: profile.course, assignment: profile.assignment, version: profile.version },
      passed,
      failed,
      skipped,
      complete: failed === 0 && skipped === 0,
      results,
      notices: options.staticOnly ? ['Behavior checks were not run because you selected --static-only.'] : []
    };
    const output = options.outputDirectory ?? join(reportsRoot, profile.course.replace(/\s+/g, '-'), profile.id.split('/').at(-1)!, runId);
    return { report, ...await writeReport(report, output) };
  } finally {
    await removeOwnedPath(temporaryRoot);
  }
}
