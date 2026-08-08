/**
 * @file Cross-platform application and user-data path definitions.
 * @author Richard Krasso
 *
 * Centralizing paths lets the CLI explain exactly where it reads and writes.
 * No module should invent an undocumented storage location independently.
 */

import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute root of the installed or development application package. */
export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Return the conventional per-user data root for the active platform. */
export function userDataRoot(
  platform: NodeJS.Platform = process.platform,
  environment: NodeJS.ProcessEnv = process.env,
  home = homedir()
): string {
  // Versioned launchers set this explicit root so custom installs and update
  // sandboxes keep reports, caches, and manifests together.
  if (environment.VERIWHY_CHECK_DATA_ROOT) return resolve(environment.VERIWHY_CHECK_DATA_ROOT);
  // Each default follows the operating system's per-user data convention. No
  // branch requires administrator privileges or writes into a course project.
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'VeriWhy Check');
  if (platform === 'win32')
    return join(environment.LOCALAPPDATA ?? join(home, 'AppData', 'Local'), 'VeriWhy Check');
  return join(environment.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'veriwhy-check');
}

/** Return Playwright's managed browser cache without inspecting user browsers. */
export function browserCacheRoot(
  platform: NodeJS.Platform = process.platform,
  environment: NodeJS.ProcessEnv = process.env,
  home = homedir()
): string {
  // An explicit environment value is authoritative for a packaged release and
  // for isolated validation. It never points at a student's personal browser.
  if (environment.PLAYWRIGHT_BROWSERS_PATH === '0') {
    // Playwright uses the special value zero for browsers colocated with its npm
    // package; retain that documented behavior for development environments.
    return join(packageRoot, 'node_modules', 'playwright-core', '.local-browsers');
  }
  if (environment.PLAYWRIGHT_BROWSERS_PATH) return resolve(environment.PLAYWRIGHT_BROWSERS_PATH);
  if (platform === 'darwin') return join(home, 'Library', 'Caches', 'ms-playwright');
  if (platform === 'win32')
    return join(environment.LOCALAPPDATA ?? join(home, 'AppData', 'Local'), 'ms-playwright');
  return join(home, '.cache', 'ms-playwright');
}

/** Stable, documented roots used by the installed application. */
// Exporting derived roots once prevents individual features from inventing
// undocumented storage locations that would weaken privacy or uninstallation.
export const dataRoot = userDataRoot();
export const reportsRoot = join(dataRoot, 'reports');
export const cacheRoot = join(dataRoot, 'cache');
export const profilesRoot = join(packageRoot, 'profiles');
export const publicChecksRoot = join(packageRoot, 'public-checks');
export const developmentTmpRoot = join(packageRoot, 'tmp');
