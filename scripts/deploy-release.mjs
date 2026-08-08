#!/usr/bin/env node
/**
 * @file Manually validate, package, version, tag, and publish one release.
 * @author Richard Krasso
 *
 * This script is deliberately invoked by the maintainer. It is not CI/CD. It
 * accepts uncommitted Markdown documentation, but refuses other uncommitted
 * files so application changes cannot be published accidentally. GitHub CLI
 * performs authenticated publication without putting a token in this project.
 */

import { execFile, spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { packageRoot } from '../dist/src/paths.js';
import {
  missingReleaseAssets,
  nextReleaseVersion,
  nonMarkdownChanges,
  parseReleaseMode,
  remoteReleaseWorkflows
} from '../dist/src/release.js';
import { releaseAssetName } from '../dist/src/update.js';

const execute = promisify(execFile);

async function capture(command, arguments_) {
  return (await execute(command, arguments_, { cwd: packageRoot, encoding: 'utf8' })).stdout.trim();
}

async function visible(command, arguments_) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, { cwd: packageRoot, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} stopped with exit code ${code ?? 'unknown'}.`)));
  });
}

async function changedPaths() {
  const groups = await Promise.all([
    capture('git', ['diff', '--name-only', '--relative']),
    capture('git', ['diff', '--cached', '--name-only', '--relative']),
    capture('git', ['ls-files', '--others', '--exclude-standard'])
  ]);
  return groups.flatMap((value) => value.split('\n')).filter(Boolean);
}

async function succeeds(command, arguments_) {
  try {
    await execute(command, arguments_, { cwd: packageRoot });
    return true;
  } catch {
    return false;
  }
}

/** Pause briefly while GitHub registers a newly dispatched workflow run. */
async function pause(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Return the recent run identifiers for one manual release workflow. */
async function workflowRunIds(workflow) {
  const output = await capture('gh', [
    'run', 'list', '--workflow', workflow, '--event', 'workflow_dispatch',
    '--limit', '20', '--json', 'databaseId', '--repo', 'buwebdev/veriwhy-check'
  ]);
  return new Set(JSON.parse(output || '[]').map((run) => String(run.databaseId)));
}

/** Find the run created after dispatch without confusing it with an older run. */
async function waitForNewWorkflowRun(workflow, previous) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const current = await workflowRunIds(workflow);
    const created = [...current].find((identifier) => !previous.has(identifier));
    if (created) return created;
    await pause(2_000);
  }
  throw new Error(`GitHub did not expose the new ${workflow} run within 60 seconds.`);
}

/** Build, validate, and upload the two packages not produced on this Mac. */
async function publishRemotePackages(tag) {
  const earlierRuns = new Map();
  for (const workflow of remoteReleaseWorkflows) {
    earlierRuns.set(workflow, await workflowRunIds(workflow));
  }
  for (const workflow of remoteReleaseWorkflows) {
    await visible('gh', [
      'workflow', 'run', workflow, '--ref', 'main',
      '-f', `source_ref=${tag}`, '-f', `release_tag=${tag}`, '-f', 'publish=true',
      '--repo', 'buwebdev/veriwhy-check'
    ]);
  }
  const runs = [];
  for (const workflow of remoteReleaseWorkflows) {
    runs.push([workflow, await waitForNewWorkflowRun(workflow, earlierRuns.get(workflow))]);
  }
  for (const [workflow, identifier] of runs) {
    console.log(`Waiting for ${workflow} (GitHub run ${identifier})...`);
    await visible('gh', ['run', 'watch', identifier, '--exit-status', '--repo', 'buwebdev/veriwhy-check']);
  }
}

/** Refuse to describe a release as complete when a platform asset is absent. */
async function verifyCompleteRelease(tag) {
  const output = await capture('gh', [
    'release', 'view', tag, '--json', 'assets', '--jq', '.assets[].name',
    '--repo', 'buwebdev/veriwhy-check'
  ]);
  const missing = missingReleaseAssets(output.split('\n').filter(Boolean));
  if (missing.length) {
    throw new Error(`The release is incomplete. Missing assets:\n- ${missing.join('\n- ')}`);
  }
}

async function main() {
  const mode = parseReleaseMode(process.argv.slice(2));
  const manifestPath = join(packageRoot, 'package.json');
  const lockPath = join(packageRoot, 'package-lock.json');
  const releaseNotesPath = join(packageRoot, 'RELEASE-NOTES.md');
  const originalManifest = await readFile(manifestPath, 'utf8');
  const originalLock = await readFile(lockPath, 'utf8');
  const manifest = JSON.parse(originalManifest);
  const target = nextReleaseVersion(manifest.version, mode);
  const tag = `v${target}`;
  const releaseNotes = await readFile(releaseNotesPath, 'utf8');
  const unexpected = nonMarkdownChanges(await changedPaths());

  if (!releaseNotes.includes(`## Version ${target}`)) {
    throw new Error(`Update RELEASE-NOTES.md with a “## Version ${target}” heading before publishing.`);
  }
  if (unexpected.length > 0) {
    throw new Error(`Commit or remove these non-Markdown changes before releasing:\n- ${unexpected.join('\n- ')}`);
  }
  if (!await succeeds('gh', ['--version'])) {
    throw new Error('GitHub CLI is required for publishing. Install it once from https://cli.github.com and then run gh auth login.');
  }
  if (!await succeeds('gh', ['auth', 'status'])) {
    throw new Error('GitHub CLI is not signed in. Run gh auth login once, then repeat this release command.');
  }
  const existingRelease = await succeeds('gh', ['release', 'view', tag, '--repo', 'buwebdev/veriwhy-check']);
  if (existingRelease && mode !== 'current') throw new Error(`${tag} already exists. Choose a new release version.`);

  let committed = false;
  try {
    if (target !== manifest.version) {
      await visible('npm', ['version', target, '--no-git-tag-version', '--allow-same-version']);
    }
    await visible('npm', ['run', 'check']);
    await visible('npm', ['run', 'lint:yaml']);
    await visible('npm', ['run', 'lint:md']);
    await visible('npm', ['run', 'docs:build']);
    await visible('node', ['scripts/package-release.mjs']);

    const archive = join(packageRoot, 'tmp', 'releases', releaseAssetName());
    const digest = `${archive}.sha256`;
    if (existingRelease) {
      await visible('gh', ['release', 'upload', tag, archive, digest, '--clobber', '--repo', 'buwebdev/veriwhy-check']);
      await publishRemotePackages(tag);
      await verifyCompleteRelease(tag);
      console.log(`Verified all supported packages in the existing ${tag} release.`);
      return;
    }

    await visible('git', ['add', '--all']);
    if (await succeeds('git', ['diff', '--cached', '--quiet'])) {
      console.log('No source or version files needed a release commit.');
    } else {
      await visible('git', ['commit', '-m', `Release ${tag}`]);
      committed = true;
    }
    if (!await succeeds('git', ['rev-parse', '--verify', `refs/tags/${tag}`])) {
      await visible('git', ['tag', '--annotate', tag, '--message', `VeriWhy Check ${tag}`]);
    }
    await visible('git', ['push', 'origin', 'main']);
    await visible('git', ['push', 'origin', tag]);
    await visible('gh', ['release', 'create', tag, archive, digest, '--verify-tag', '--notes-file', releaseNotesPath, '--title', `VeriWhy Check ${tag}`, '--repo', 'buwebdev/veriwhy-check']);
    await publishRemotePackages(tag);
    await verifyCompleteRelease(tag);
    console.log(`Published and verified VeriWhy Check ${tag} for every supported platform.`);
  } catch (error) {
    if (!committed) {
      await writeFile(manifestPath, originalManifest);
      await writeFile(lockPath, originalLock);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(`\nRelease stopped safely.\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
