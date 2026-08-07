/**
 * @file Pure helpers for the manually initiated VeriWhy Check release command.
 * @author Richard Krasso
 *
 * These helpers contain no GitHub or file-system side effects, which keeps the
 * version decisions easy to test independently from an actual publication.
 */

import { normalizeVersion } from './update.js';

export type ReleaseMode = 'current' | 'patch' | 'minor' | 'major';

/** Accept exactly one deliberate semantic-version release choice. */
export function parseReleaseMode(arguments_: string[]): ReleaseMode {
  if (arguments_.length !== 1 || !['current', 'patch', 'minor', 'major'].includes(arguments_[0] ?? '')) {
    throw new Error('Choose one release type: current, patch, minor, or major. Example: npm run deploy -- patch');
  }
  return arguments_[0] as ReleaseMode;
}

/** Calculate the release version without changing package files. */
export function nextReleaseVersion(current: string, mode: ReleaseMode): string {
  const normalized = normalizeVersion(current);
  if (normalized.includes('-')) throw new Error('The manual release command supports stable versions only.');
  if (mode === 'current') return normalized;
  const parts = normalized.split('.').map(Number);
  const major = parts[0]!;
  const minor = parts[1]!;
  const patch = parts[2]!;
  if (mode === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (mode === 'minor') return `${major}.${minor + 1}.0`;
  return `${major + 1}.0.0`;
}

/** Only documentation may be automatically included from a working tree. */
export function nonMarkdownChanges(paths: string[]): string[] {
  return [...new Set(paths.filter((path) => !path.toLowerCase().endsWith('.md')))].sort();
}
