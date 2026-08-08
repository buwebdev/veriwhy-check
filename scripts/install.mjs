#!/usr/bin/env node
/**
 * @file Entry point bundled with each downloadable release archive.
 * @author Richard Krasso
 *
 * This script has no third-party dependencies. It delegates to the tested
 * installer inside the verified payload and supports sandbox paths used by
 * release validation so tests never change a developer's normal installation.
 */

import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const archiveRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
// Release validation supplies custom roots so it can exercise the real
// installer without touching the maintainer's normal per-user installation.
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

// Keep application state in the conventional non-administrator location for
// each operating system. Student projects are never installation destinations.
const defaultDataRoot =
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support', 'VeriWhy Check')
    : process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'VeriWhy Check')
      : join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'veriwhy-check');
const defaultBinRoot =
  process.platform === 'win32' ? join(defaultDataRoot, 'bin') : join(homedir(), '.local', 'bin');
const dataRoot = resolve(value('--data-root') ?? defaultDataRoot);
const binRoot = resolve(value('--bin-root') ?? defaultBinRoot);

try {
  // Import only from the checksum-verified payload. This bootstrap has no npm
  // dependencies and delegates mutation to the separately tested installer.
  const installer = await import(new URL('./payload/app/dist/src/install.js', import.meta.url));
  const result = await installer.installPayload(join(archiveRoot, 'payload'), dataRoot, binRoot);
  console.log(`VeriWhy Check ${result.activeVersion} is installed.`);
  console.log(`Command location: ${result.launcher}`);
  console.log('Open a new terminal and enter: veriwhy-check doctor');
} catch (error) {
  // A concise terminal error is required here because the offline visual guide
  // and report writer are not available until installation succeeds.
  console.error(
    `VeriWhy Check was not installed.\n${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
}
