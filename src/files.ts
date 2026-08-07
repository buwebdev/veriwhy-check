/**
 * @file Safe file discovery, reading, copying, and cleanup utilities.
 * @author Richard Krasso
 *
 * These helpers enforce the privacy boundary around a selected project. They
 * ignore generated and repository-management directories and never follow
 * symbolic links while collecting student-authored source.
 */

import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';

/** Directories excluded from source inspection and temporary project copies. */
const ignoredDirectories = new Set([
  '.angular',
  '.git',
  '.veriwhy-check',
  'coverage',
  'dist',
  'node_modules',
  'veriwhy-check-reports'
]);

/** Determine whether an absolute or relative path exists without throwing. */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Validate a profile path before combining it with a selected project root. */
export function isSafeRelativePath(path: string): boolean {
  if (!path || path.includes('\0') || path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)) return false;
  return !path.split(/[\\/]/).includes('..');
}

/** Confirm a resolved candidate remains within its intended root directory. */
export function isInside(root: string, candidate: string): boolean {
  const fromRoot = relative(resolve(root), resolve(candidate));
  return fromRoot === '' || (fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`));
}

/** Recursively list ordinary files relative to a root without following links. */
export async function listFiles(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.nvmrc') continue;
    if (ignoredDirectories.has(entry.name) || entry.isSymbolicLink()) continue;
    const fullPath = join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, fullPath));
    else if (entry.isFile()) files.push(relative(root, fullPath).split(sep).join('/'));
  }
  return files.sort();
}

/** Identify authored test files while excluding injected checker files. */
export function isStudentTestFile(file: string): boolean {
  return /\.(?:spec|test)\.(?:js|ts)$/.test(file) && !/veriwhy-check\.public\.(?:spec|test)\.(?:js|ts)$/.test(file);
}

/** Read eligible implementation files beneath profile-approved roots. */
export async function readSources(root: string, roots: string[], tests = false): Promise<string> {
  const files = await listFiles(root);
  const selected = files.filter((file) =>
    isStudentTestFile(file) === tests &&
    roots.some((sourceRoot) => file === sourceRoot || file.startsWith(`${sourceRoot}/`)) &&
    /\.(?:css|html|js|json|mjs|cjs|ts)$/.test(file)
  );
  const sections = await Promise.all(selected.map(async (file) => {
    const contents = await readFile(join(root, file), 'utf8');
    return `\n/* ${file} */\n${contents}`;
  }));
  return sections.join('');
}

/** Copy a project into an isolated destination while excluding generated data. */
export async function copyProject(source: string, destination: string): Promise<void> {
  const resolvedSource = resolve(source);
  await mkdir(destination, { recursive: true });
  await cp(resolvedSource, destination, {
    recursive: true,
    dereference: false,
    filter: (path) => !ignoredDirectories.has(basename(path))
  });
}

/** Remove a path that the caller has already constrained to an owned root. */
export async function removeOwnedPath(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}
