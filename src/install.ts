/**
 * @file Versioned installation and launcher creation used by release packages.
 * @author Richard Krasso
 *
 * A new release is copied beside the current release and only then becomes
 * active through a tiny launcher. This keeps the previous version available
 * if copying fails and avoids replacing a running executable on Windows.
 */

import { chmod, cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathExists } from './files.js';

export interface InstallManifest {
  /** Enables future manifest migrations without guessing its structure. */
  schemaVersion: 1;
  /** Version selected by the stable command launcher. */
  activeVersion: string;
  /** Application-owned data boundary validated during uninstallation. */
  installRoot: string;
  /** Exact command file created for this user. */
  launcher: string;
  /** Audit timestamp for support and update diagnostics. */
  installedAt: string;
}

/** Validate the payload's release version without loading application dependencies. */
function releaseVersion(value: string): string {
  const normalized = value.trim().replace(/^v/i, '');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalized))
    throw new Error(`The packaged release version “${value}” is not valid.`);
  return normalized;
}

/** Return the launcher filename for one operating system. */
export function launcherName(platform: NodeJS.Platform): string {
  return platform === 'win32' ? 'veriwhy-check.cmd' : 'veriwhy-check';
}

/** Create a launcher that forwards every student argument to bundled Node.js. */
export function launcherSource(versionRoot: string, platform: NodeJS.Platform): string {
  // Launchers carry explicit data and browser roots so the packaged application
  // never falls back to a global Node.js, npm, Playwright, or browser install.
  const runtime = join(versionRoot, 'runtime');
  const node = join(runtime, platform === 'win32' ? 'node.exe' : 'node');
  const cli = join(versionRoot, 'app', 'dist', 'src', 'cli.js');
  const browsers = join(versionRoot, 'browsers');
  const dataRoot = resolve(versionRoot, '..', '..');
  if (platform === 'win32')
    // The Windows launcher preserves the child's exit code and removes itself
    // only after a successful, non-preview uninstall command has returned.
    return `@echo off\r\nset "VERIWHY_CHECK_DATA_ROOT=${dataRoot}"\r\nset "PLAYWRIGHT_BROWSERS_PATH=${browsers}"\r\nset "PATH=${runtime};%PATH%"\r\n"${node}" "${cli}" %*\r\nset "_veriwhy_exit=%ERRORLEVEL%"\r\nset "_veriwhy_dry_run="\r\nfor %%A in (%*) do if /I "%%~A"=="--dry-run" set "_veriwhy_dry_run=1"\r\nif "%_veriwhy_exit%"=="0" if /I "%~1"=="uninstall" if not defined _veriwhy_dry_run goto veriwhy_self_remove\r\nexit /b %_veriwhy_exit%\r\n:veriwhy_self_remove\r\n(goto) 2>nul & del "%~f0"\r\n`;
  // POSIX single-quote escaping prevents installation paths containing spaces
  // or punctuation from being reinterpreted by the launcher shell.
  const quote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;
  return `#!/bin/sh\nPATH=${quote(runtime)}:"$PATH" VERIWHY_CHECK_DATA_ROOT=${quote(dataRoot)} PLAYWRIGHT_BROWSERS_PATH=${quote(browsers)} exec ${quote(node)} ${quote(cli)} "$@"\n`;
}

/** Validate the minimum signed payload structure before copying any release. */
export async function validatePayload(payloadRoot: string): Promise<void> {
  const nodeName = process.platform === 'win32' ? 'node.exe' : 'node';
  const npmName = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const required = [
    // Validate runtime, package manager, application entrypoint, and public
    // assessment data before copying any bytes into the versioned install root.
    join(payloadRoot, 'runtime', nodeName),
    join(payloadRoot, 'runtime', npmName),
    join(payloadRoot, 'runtime', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(payloadRoot, 'app', 'package.json'),
    join(payloadRoot, 'app', 'dist', 'src', 'cli.js'),
    join(payloadRoot, 'app', 'profiles'),
    join(payloadRoot, 'app', 'public-checks')
  ];
  const missing = [];
  for (const path of required) if (!(await pathExists(path))) missing.push(path);
  if (missing.length)
    throw new Error(
      `The release package is incomplete (${missing.length} required item(s) missing). Nothing was installed.`
    );
}

/** Install and activate one already verified release payload. */
export async function installPayload(
  payloadRoot: string,
  dataDirectory: string,
  binDirectory: string,
  platform: NodeJS.Platform = process.platform
): Promise<InstallManifest> {
  await validatePayload(payloadRoot);
  const packageManifest = JSON.parse(
    await readFile(join(payloadRoot, 'app', 'package.json'), 'utf8')
  ) as { version?: string };
  const version = releaseVersion(packageManifest.version ?? '');
  const installRoot = resolve(dataDirectory);
  const versionRoot = join(installRoot, 'versions', version);
  // Staging and backup folders include the process id so interrupted concurrent
  // attempts cannot share a transaction directory.
  const stagingRoot = join(installRoot, 'versions', `.installing-${version}-${process.pid}`);
  const backupRoot = join(installRoot, 'versions', `.previous-${version}-${process.pid}`);
  const launcher = join(resolve(binDirectory), launcherName(platform));
  await mkdir(join(installRoot, 'versions'), { recursive: true });
  await rm(stagingRoot, { recursive: true, force: true });
  await rm(backupRoot, { recursive: true, force: true });
  await cp(payloadRoot, stagingRoot, { recursive: true, force: true });
  // Executable bits can be lost while an archive crosses filesystems. Restore
  // only the two known runtime launchers rather than chmodding an entire tree.
  if (platform !== 'win32') {
    await chmod(join(stagingRoot, 'runtime', 'node'), 0o755);
    await chmod(join(stagingRoot, 'runtime', 'npm'), 0o755);
  }
  const replacing = await pathExists(versionRoot);
  try {
    // The old same-version folder moves aside before the staged folder becomes
    // active. If activation fails, the catch block restores that known-good copy.
    if (replacing) await rename(versionRoot, backupRoot);
    await rename(stagingRoot, versionRoot);
    await rm(backupRoot, { recursive: true, force: true });
  } catch (error) {
    if (!(await pathExists(versionRoot)) && (await pathExists(backupRoot)))
      await rename(backupRoot, versionRoot);
    await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  }
  await mkdir(resolve(binDirectory), { recursive: true });
  // Write the stable launcher only after the complete version is in place. This
  // is the activation boundary students depend on during updates.
  await writeFile(launcher, launcherSource(versionRoot, platform), 'utf8');
  if (platform !== 'win32') await chmod(launcher, 0o755);
  const manifest: InstallManifest = {
    schemaVersion: 1,
    activeVersion: version,
    installRoot,
    launcher,
    installedAt: new Date().toISOString()
  };
  await writeFile(
    join(installRoot, 'install.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  // The manifest is written last because its presence declares a complete,
  // uninstallable installation to future update and removal commands.
  return manifest;
}
