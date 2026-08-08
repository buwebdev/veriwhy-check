/**
 * @file Notification-safe Playwright browser discovery and release copying.
 * @author Richard Krasso
 *
 * VeriWhy Check needs Chromium's rendering engine, but it does not need a
 * normal macOS application bundle. Shipping only Playwright's headless shell
 * preserves DOM, CSS, viewport, screenshot, and Angular/Karma checks without
 * registering Google Chrome for Testing in macOS Notifications.
 */

import { existsSync, readdirSync } from 'node:fs';
import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { browserCacheRoot } from './paths.js';

/** Browser-cache directory names that are safe and required in a release. */
export function releaseBrowserEntry(name: string): boolean {
  return name.startsWith('chromium_headless_shell-') || name.startsWith('ffmpeg-');
}

/** Recursively find one filename within a small, application-owned tree. */
function findFile(root: string, filename: string, depth = 4): string | undefined {
  // Playwright's internal directory names vary by platform and revision. A
  // shallow bounded search is more robust than hard-coding that private layout.
  if (depth < 0 || !existsSync(root)) return undefined;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const candidate = join(root, entry.name);
    if (entry.isFile() && entry.name === filename) return candidate;
    if (entry.isDirectory()) {
      const nested = findFile(candidate, filename, depth - 1);
      if (nested) return nested;
    }
  }
  return undefined;
}

/** Locate the newest managed headless-shell executable for Karma and Angular. */
export function headlessShellExecutablePath(
  root = browserCacheRoot(),
  platform: NodeJS.Platform = process.platform
): string {
  const executable = platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
  const revisions = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('chromium_headless_shell-'))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  // Numeric sorting matters once revision numbers have different digit counts;
  // lexical sorting would incorrectly place revision 99 after revision 100.
  for (const revision of revisions) {
    const found = findFile(join(root, revision), executable);
    if (found) return found;
  }
  throw new Error('The managed headless checking browser is missing. Reinstall VeriWhy Check.');
}

/** Return every macOS application bundle found beneath a release directory. */
export async function findMacAppBundles(root: string): Promise<string[]> {
  const found: string[] = [];
  async function visit(directory: string): Promise<void> {
    // Application bundles are directories on macOS. Finding even one is enough
    // for packaging to fail because it could register in Notifications.
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = join(directory, entry.name);
      if (entry.name.endsWith('.app')) found.push(candidate);
      else await visit(candidate);
    }
  }
  await visit(root);
  return found;
}

/** Copy only the headless browser runtime and reject notification-capable apps. */
export async function copyHeadlessBrowserRuntime(
  source: string,
  destination: string
): Promise<void> {
  const entries = (await readdir(source, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && releaseBrowserEntry(entry.name)
  );
  // Deliberately copy an allowlist rather than copying everything and deleting
  // known unwanted items. Future Playwright cache additions therefore stay out.
  if (!entries.some((entry) => entry.name.startsWith('chromium_headless_shell-'))) {
    throw new Error(
      'The Playwright headless shell is missing. Run npm run setup:browser before packaging.'
    );
  }
  await mkdir(destination, { recursive: true });
  for (const entry of entries) {
    await cp(join(source, entry.name), join(destination, entry.name), { recursive: true });
  }
  const applications = await findMacAppBundles(destination);
  if (applications.length) {
    throw new Error(`Release packaging refused macOS application bundle: ${applications[0]}`);
  }
  // Resolve the copied executable as the final postcondition. A directory with
  // the right name but an incomplete download must not become a release.
  headlessShellExecutablePath(destination);
}
