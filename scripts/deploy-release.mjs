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
import { nextReleaseVersion, nonMarkdownChanges, parseReleaseMode } from '../dist/src/release.js';
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

async function main() {
  const mode = parseReleaseMode(process.argv.slice(2));
  const manifestPath = join(packageRoot, 'package.json');
  const lockPath = join(packageRoot, 'package-lock.json');
  const originalManifest = await readFile(manifestPath, 'utf8');
  const originalLock = await readFile(lockPath, 'utf8');
  const manifest = JSON.parse(originalManifest);
  const target = nextReleaseVersion(manifest.version, mode);
  const tag = `v${target}`;
  const unexpected = nonMarkdownChanges(await changedPaths());

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
      console.log(`Uploaded this computer's package to the existing ${tag} release.`);
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
    await visible('gh', ['release', 'create', tag, archive, digest, '--verify-tag', '--generate-notes', '--title', `VeriWhy Check ${tag}`, '--repo', 'buwebdev/veriwhy-check']);
    console.log(`Published VeriWhy Check ${tag}.`);
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
