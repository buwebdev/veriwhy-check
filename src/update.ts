/**
 * @file Verified, fail-safe update discovery and installation workflow.
 * @author Richard Krasso
 *
 * Updates come only from the official GitHub release. The archive digest is
 * verified before extraction, and the bundled installer is responsible for
 * activating a new version without deleting a working current version.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { runCommand } from './runner.js';
import { cacheRoot, dataRoot, packageRoot } from './paths.js';

const latestReleaseUrl = 'https://api.github.com/repos/buwebdev/veriwhy-check/releases/latest';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  digest?: string | null;
}
interface Release {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface UpdateResult {
  changed: boolean;
  message: string;
}

export interface UpdateOptions {
  cacheDirectory?: string;
  dataDirectory?: string;
  currentVersion?: string;
  platform?: NodeJS.Platform;
  architecture?: NodeJS.Architecture;
}

export interface UpdateServices {
  fetch(input: string, init?: RequestInit): Promise<Response>;
  run(
    executable: string,
    args: string[],
    cwd: string,
    timeoutSeconds: number
  ): Promise<{ passed: boolean; detail: string }>;
}

const defaultServices: UpdateServices = { fetch: globalThis.fetch, run: runCommand };

/** Normalize a release tag before a numeric semantic-version comparison. */
export function normalizeVersion(value: string): string {
  const normalized = value.trim().replace(/^v/i, '');
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalized))
    throw new Error(`The release version “${value}” is not valid.`);
  return normalized;
}

/** Determine whether a stable semantic version is newer than another. */
export function isNewerVersion(candidate: string, current: string): boolean {
  const left = normalizeVersion(candidate).split('-')[0]!.split('.').map(Number);
  const right = normalizeVersion(current).split('-')[0]!.split('.').map(Number);
  for (let index = 0; index < left.length; index += 1) {
    // Compare numeric components instead of version strings so 1.10 correctly
    // sorts after 1.9. The first differing component decides the ordering.
    if (left[index] !== right[index]) return left[index]! > right[index]!;
  }
  return false;
}

/** Translate Node platform names into the published release-asset convention. */
export function releaseAssetName(platform = process.platform, architecture = process.arch): string {
  // Platform translation is intentionally exhaustive for known archive names.
  // An unsupported computer receives an explanation before any download.
  const supportedPlatform =
    platform === 'darwin'
      ? 'macos'
      : platform === 'win32'
        ? 'windows'
        : platform === 'linux'
          ? 'linux'
          : undefined;
  const supportedArchitecture =
    architecture === 'arm64' ? 'arm64' : architecture === 'x64' ? 'x64' : undefined;
  if (!supportedPlatform || !supportedArchitecture)
    throw new Error(`Automatic updates are not available for ${platform}/${architecture}.`);
  return `veriwhy-check-${supportedPlatform}-${supportedArchitecture}.tar.gz`;
}

/** Download bytes with explicit GitHub headers and a useful failure message. */
async function download(url: string, services: UpdateServices): Promise<Buffer> {
  // The explicit GitHub media type and user agent make the request predictable
  // and avoid relying on browser-only defaults.
  const response = await services.fetch(url, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'veriwhy-check' }
  });
  if (!response.ok)
    throw new Error(`The update server returned HTTP ${response.status}. Try again later.`);
  return Buffer.from(await response.arrayBuffer());
}

/** Read the running package version without trusting command-line input. */
async function currentVersion(): Promise<string> {
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as {
    version: string;
  };
  return normalizeVersion(manifest.version);
}

/** Check, verify, extract, and activate the newest official release. */
export async function updateApplication(
  services: UpdateServices = defaultServices,
  options: UpdateOptions = {}
): Promise<UpdateResult> {
  const releaseResponse = await services.fetch(latestReleaseUrl, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'veriwhy-check' }
  });
  if (!releaseResponse.ok)
    throw new Error(
      `The update server returned HTTP ${releaseResponse.status}. Your current installation was not changed.`
    );
  const release = (await releaseResponse.json()) as Release;
  // Release metadata is consulted first. An up-to-date installation therefore
  // downloads no archive and performs no filesystem mutation.
  const latest = normalizeVersion(release.tag_name);
  const current = options.currentVersion
    ? normalizeVersion(options.currentVersion)
    : await currentVersion();
  if (!isNewerVersion(latest, current))
    return { changed: false, message: `You already have the newest version (${current}).` };
  const name = releaseAssetName(options.platform, options.architecture);
  const asset = release.assets.find((candidate) => candidate.name === name);
  if (!asset)
    throw new Error(
      `Version ${latest} does not include the required ${name} package. Your current installation was not changed.`
    );
  if (!asset.digest?.startsWith('sha256:'))
    throw new Error(
      'The update package does not have a published SHA-256 digest. It was not installed.'
    );
  const bytes = await download(asset.browser_download_url, services);
  // Integrity verification occurs in memory before an archive is written or
  // extracted. A corrupt or substituted download cannot reach the installer.
  const actual = createHash('sha256').update(bytes).digest('hex');
  const expected = asset.digest.slice('sha256:'.length).toLowerCase();
  if (actual !== expected)
    throw new Error(
      'The update package failed its safety check. It was deleted and your current installation was not changed.'
    );
  const updateRoot = join(options.cacheDirectory ?? cacheRoot, 'updates', latest);
  // Version-specific staging lets a failed update remain isolated from the
  // active installation and gives support staff a precise diagnostic location.
  await mkdir(updateRoot, { recursive: true });
  const archive = join(updateRoot, name);
  const extracted = join(updateRoot, 'extracted');
  await writeFile(archive, bytes);
  await mkdir(extracted, { recursive: true });
  const unpack = await services.run('tar', ['-xzf', archive, '-C', extracted], updateRoot, 120);
  if (!unpack.passed)
    throw new Error(`The verified update could not be unpacked. ${unpack.detail}`);
  const installer = join(extracted, 'install.mjs');
  const installationRoot = options.dataDirectory ?? dataRoot;
  let launcher: string;
  try {
    // The existing manifest is the authority for the chosen command directory;
    // guessing a path could create two conflicting installations.
    const installation = JSON.parse(
      await readFile(join(installationRoot, 'install.json'), 'utf8')
    ) as { launcher?: string };
    if (!installation.launcher) throw new Error('missing launcher');
    launcher = installation.launcher;
  } catch {
    throw new Error(
      'The installation record is missing. Use the official installer once before using automatic updates.'
    );
  }
  const install = await services.run(
    process.execPath,
    [installer, '--update', '--data-root', installationRoot, '--bin-root', dirname(launcher)],
    extracted,
    180
  );
  // Activation is delegated to the same transactional installer used by fresh
  // releases, preserving one audited implementation of version switching.
  if (!install.passed)
    throw new Error(`The verified update could not be activated. ${install.detail}`);
  return {
    changed: true,
    message: `VeriWhy Check was updated from ${current} to ${latest}. Run veriwhy-check doctor to confirm it is ready.`
  };
}
