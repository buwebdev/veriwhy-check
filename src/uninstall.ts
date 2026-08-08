/**
 * @file Transparent, report-preserving Version 1 uninstallation workflow.
 * @author Richard Krasso
 *
 * Uninstallation is driven only by the installation manifest, validates every
 * application-owned target, preserves reports by default, and provides a true
 * dry run. Windows schedules deletion after the running bundled Node process
 * exits so locked runtime files do not leave a partial installation.
 */

import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { isInside, pathExists } from './files.js';
import type { InstallManifest } from './install.js';

export interface UninstallOptions {
  /** Exact data root recorded during installation. */
  dataDirectory: string;
  /** Report the plan without changing any file. */
  dryRun?: boolean;
  /** Separate opt-in because reports are student-owned evidence. */
  removeReports?: boolean;
  /** Injectable platform used to exercise Windows behavior in unit tests. */
  platform?: NodeJS.Platform;
}

export interface UninstallResult {
  scheduled: boolean;
  removed: string[];
  preserved: string[];
}

/** Read and constrain the install record before identifying deletion targets. */
export async function uninstallPlan(
  options: UninstallOptions
): Promise<{ targets: string[]; preserved: string[] }> {
  const root = resolve(options.dataDirectory);
  // Even a corrupted manifest must never make a filesystem root or home folder
  // eligible for recursive deletion. This guard precedes manifest parsing.
  if (root === resolve('/') || root === resolve(process.env.HOME ?? '/no-home'))
    throw new Error('The recorded application data path is too broad to uninstall safely.');
  let manifest: InstallManifest;
  try {
    manifest = JSON.parse(await readFile(join(root, 'install.json'), 'utf8')) as InstallManifest;
  } catch {
    throw new Error('No VeriWhy Check installation record was found. Nothing was removed.');
  }
  if (resolve(manifest.installRoot) !== root)
    throw new Error(
      'The installation record does not match this application data folder. Nothing was removed.'
    );
  const owned = [join(root, 'versions'), join(root, 'cache'), join(root, 'install.json')];
  // Reports are absent from the default target list by design. Their removal
  // requires the explicit flag shown in the uninstall documentation.
  if (options.removeReports) owned.push(join(root, 'reports'));
  if (owned.some((path) => !isInside(root, path)))
    throw new Error(
      'An uninstall target is outside the application data folder. Nothing was removed.'
    );
  const targets = [resolve(manifest.launcher), ...owned];
  const preserved = options.removeReports ? [] : [join(root, 'reports')];
  return { targets, preserved };
}

/** Build a Windows helper that waits for this process and retries locked files. */
export function windowsRemovalScript(targets: string[], processId = process.pid): string {
  // PowerShell single-quoted literals escape a quote by doubling it. Building
  // literals this way prevents an installation path from becoming script code.
  const literals = targets.map((target) => `'${target.replaceAll("'", "''")}'`).join(',');
  return (
    `# VeriWhy Check deferred uninstaller. Author: Richard Krasso.\n` +
    `Wait-Process -Id ${processId} -ErrorAction SilentlyContinue\n` +
    `$targets = @(${literals})\n` +
    // A .cmd launcher can remain locked briefly after its Node child exits.
    // Retry each application-owned target rather than leaving a partial install.
    `foreach ($target in $targets) {\n` +
    `  for ($attempt = 0; $attempt -lt 80 -and (Test-Path -LiteralPath $target); $attempt++) {\n` +
    `    Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue\n` +
    `    if (Test-Path -LiteralPath $target) { Start-Sleep -Milliseconds 250 }\n` +
    `  }\n` +
    `}\n` +
    `Remove-Item -LiteralPath $PSScriptRoot -Recurse -Force -ErrorAction SilentlyContinue\n`
  );
}

/** Write a temporary Windows cleanup helper that waits for this process. */
async function scheduleWindowsRemoval(targets: string[]): Promise<void> {
  // The helper lives in an operating-system temporary folder, not under the
  // installation it is about to remove, so it survives long enough to finish.
  const helperRoot = join(tmpdir(), `veriwhy-check-uninstall-${process.pid}`);
  const helper = join(helperRoot, 'uninstall.ps1');
  await mkdir(helperRoot, { recursive: true });
  await writeFile(helper, windowsRemovalScript(targets), 'utf8');
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', helper],
    { detached: true, stdio: 'ignore', windowsHide: true }
  );
  // A detached hidden process can wait for the current bundled Node executable
  // to unlock without keeping the student's terminal session open.
  child.unref();
}

/** Perform or schedule the exact removal plan. */
export async function uninstallApplication(options: UninstallOptions): Promise<UninstallResult> {
  const plan = await uninstallPlan(options);
  // Dry run returns the exact same validated plan used by removal; it is not a
  // separately reconstructed approximation that could disagree with reality.
  if (options.dryRun) return { scheduled: false, removed: plan.targets, preserved: plan.preserved };
  const existing = [];
  // Missing targets are normal after a partial prior uninstall and are omitted
  // from the result rather than treated as a destructive-operation failure.
  for (const target of plan.targets) if (await pathExists(target)) existing.push(target);
  if ((options.platform ?? process.platform) === 'win32') {
    // The .cmd launcher removes itself after its Node child returns. Process
    // the remaining application data first so a locked launcher cannot delay it.
    await scheduleWindowsRemoval([...existing.slice(1), ...existing.slice(0, 1)]);
    return { scheduled: true, removed: existing, preserved: plan.preserved };
  }
  for (const target of existing) await rm(target, { recursive: true, force: true });
  return { scheduled: false, removed: existing, preserved: plan.preserved };
}
