/**
 * @file Locate and open the bundled offline student documentation website.
 * @author Richard Krasso
 *
 * Documentation ships as ordinary local HTML so it remains available when a
 * course network is unavailable. Opening is separated from path resolution to
 * support accessibility tools, diagnostics, and deterministic unit tests.
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pathExists } from './files.js';
import { packageRoot } from './paths.js';

export interface GuideOpenResult {
  /** Absolute file path that can always be shown or copied. */
  path: string;
  /** Whether this call requested and successfully launched the default app. */
  opened: boolean;
}
export type GuideOpener = (executable: string, args: string[]) => Promise<void>;

/** Choose the operating-system command that opens a file in its default app. */
export function guideOpenCommand(
  path: string,
  platform: NodeJS.Platform = process.platform
): { executable: string; args: string[] } {
  // Each command receives the file path as a separate argument. No shell is
  // involved, so spaces and shell metacharacters cannot become commands.
  if (platform === 'darwin') return { executable: 'open', args: [path] };
  if (platform === 'win32') return { executable: 'explorer.exe', args: [path] };
  return { executable: 'xdg-open', args: [path] };
}

/** Default detached opener so the CLI can finish after launching the browser. */
const defaultOpener: GuideOpener = async (executable, args) =>
  await new Promise((resolveOpen, reject) => {
    // Detaching lets the CLI return immediately while the student's browser
    // remains open. Ignored stdio prevents the browser from holding the terminal.
    const child = spawn(executable, args, { detached: true, stdio: 'ignore' });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolveOpen();
    });
  });

/** Prefer the installed site and fall back to the ignored development build. */
export async function guidePath(): Promise<string> {
  // Installed releases prefer the bundled site; maintainers receive the same
  // command experience from the ignored development preview when available.
  const candidates = [
    join(packageRoot, 'site', 'index.html'),
    join(packageRoot, 'tmp', 'docs-site', 'index.html')
  ];
  for (const candidate of candidates) if (await pathExists(candidate)) return candidate;
  throw new Error(
    'The visual guide is not built. Run npm run docs:build or reinstall VeriWhy Check.'
  );
}

/** Open the guide, or only return its path for accessibility and diagnostics. */
export async function openGuide(
  open = true,
  opener: GuideOpener = defaultOpener,
  platform: NodeJS.Platform = process.platform,
  resolvePath: () => Promise<string> = guidePath
): Promise<GuideOpenResult> {
  const path = await resolvePath();
  // --path intentionally avoids launching a GUI, which helps screen-reader
  // workflows, remote shells, and support diagnostics.
  if (!open) return { path, opened: false };
  const command = guideOpenCommand(path, platform);
  try {
    await opener(command.executable, command.args);
    return { path, opened: true };
  } catch {
    throw new Error(
      `The guide could not open automatically. Open this file in your browser:\n  ${path}`
    );
  }
}
