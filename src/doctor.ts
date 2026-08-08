/**
 * @file Read-only installation diagnostics and storage-location descriptions.
 * @author Richard Krasso
 *
 * The doctor command deliberately diagnoses only prerequisites that VeriWhy
 * Check owns or requires. It never repairs files automatically, reads student
 * projects, or changes operating-system settings; corrective action remains
 * visible and under the student's control.
 */

import { access } from 'node:fs/promises';
import { headlessShellExecutablePath } from './browser-runtime.js';
import {
  browserCacheRoot,
  cacheRoot,
  dataRoot,
  packageRoot,
  profilesRoot,
  publicChecksRoot,
  reportsRoot
} from './paths.js';
import { listProfileIds } from './profile.js';

export interface Diagnostic {
  /** Short name displayed at the beginning of one readiness line. */
  label: string;
  /** Machine-readable outcome used to select the CLI exit code. */
  ok: boolean;
  /** Plain-language observation and, when needed, corrective direction. */
  detail: string;
}

/** Run safe, read-only checks and explain corrective action for each failure. */
export async function runDoctor(): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  // Checking the bundled runtime first helps distinguish an incomplete install
  // from a course-project problem before more files are inspected.
  diagnostics.push({
    label: 'Node.js',
    ok: process.versions.node.startsWith('24.'),
    detail: `Using Node.js ${process.versions.node}; version 24 is required.`
  });
  const profiles = await listProfileIds();
  // A nonzero profile count is the minimum useful catalog check. The strict
  // profile linter performs deeper schema validation during release testing.
  diagnostics.push({
    label: 'Assignment profiles',
    ok: profiles.length > 0,
    detail: profiles.length
      ? `${profiles.length} assignment profiles are available.`
      : 'No assignment profiles were found. Reinstall VeriWhy Check.'
  });
  try {
    // Resolve and access the exact executable used by functional checks; merely
    // finding a similarly named browser directory would be a false readiness.
    await access(headlessShellExecutablePath());
    diagnostics.push({
      label: 'Managed browser',
      ok: true,
      detail: 'The private checking browser is ready.'
    });
  } catch {
    diagnostics.push({
      label: 'Managed browser',
      ok: false,
      detail:
        'The checking browser is missing. Reinstall VeriWhy Check or run the browser setup command from the installation guide.'
    });
  }
  return diagnostics;
}

/** Describe every durable application location in plain language. */
export function locationText(): string {
  // Paths are generated from the same central constants used by the application
  // so the privacy statement cannot drift from actual storage behavior.
  return `VeriWhy Check storage locations

Application files (read only):
  ${packageRoot}

Assignment profiles (read only):
  ${profilesRoot}

Public checks (read only):
  ${publicChecksRoot}

Your saved reports:
  ${reportsRoot}

Application cache:
  ${cacheRoot}

Managed browser files:
  ${browserCacheRoot()}

Application data root:
  ${dataRoot}

VeriWhy Check does not use your installed browser profile or upload source code.`;
}
