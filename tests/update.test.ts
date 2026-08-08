/**
 * @file Unit tests for verified update selection and fail-safe responses.
 * @author Richard Krasso
 *
 * The update suite proves version selection, architecture mapping, signed-byte
 * verification, safe staging, manifest authority, activation, and rollback
 * messaging. Network and process services are controlled doubles so no test
 * modifies a published release or normal installation.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { installPayload } from '../src/install.js';
import { packageRoot } from '../src/paths.js';
import { runCommand } from '../src/runner.js';
import {
  isNewerVersion,
  normalizeVersion,
  releaseAssetName,
  updateApplication,
  type UpdateServices
} from '../src/update.js';
import { withFixture } from './helpers.js';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('semantic versions compare numerically and reject invalid release tags', () => {
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3');
  assert.equal(isNewerVersion('1.10.0', '1.9.9'), true);
  assert.equal(isNewerVersion('2.0.0', '2.0.0'), false);
  assert.equal(isNewerVersion('1.9.9', '2.0.0'), false);
  assert.throws(() => normalizeVersion('newest'), /not valid/);
});

test('release names cover supported platforms and explain unsupported systems', () => {
  assert.equal(releaseAssetName('darwin', 'arm64'), 'veriwhy-check-macos-arm64.tar.gz');
  assert.equal(releaseAssetName('win32', 'x64'), 'veriwhy-check-windows-x64.tar.gz');
  assert.equal(releaseAssetName('linux', 'x64'), 'veriwhy-check-linux-x64.tar.gz');
  assert.throws(() => releaseAssetName('aix', 'ppc64'), /not available/);
});

test('up-to-date checks do not download or run an installer', async () => {
  let runs = 0;
  const services: UpdateServices = {
    fetch: async () =>
      response({ tag_name: 'v0.1.0', html_url: 'https://example.test', assets: [] }),
    run: async () => {
      runs += 1;
      return { passed: true, detail: '' };
    }
  };
  const result = await updateApplication(services);
  assert.equal(result.changed, false);
  assert.match(result.message, /newest version/);
  assert.equal(runs, 0);
});

test('update failures preserve the current installation and explain why', async () => {
  const missing: UpdateServices = {
    fetch: async () =>
      response({ tag_name: 'v9.0.0', html_url: 'https://example.test', assets: [] }),
    run: async () => ({ passed: true, detail: '' })
  };
  await assert.rejects(updateApplication(missing), /does not include the required/);
  const serverError: UpdateServices = { fetch: async () => response({}, 503), run: missing.run };
  await assert.rejects(updateApplication(serverError), /current installation was not changed/);
});

test('unsigned, corrupted, and unpackable updates stop before activation', async () => {
  await withFixture('update-safety', async (root) => {
    const name = releaseAssetName(process.platform, process.arch);
    const metadata = (digest: string | null) =>
      response({
        tag_name: 'v9.0.0',
        html_url: 'https://example.test',
        assets: [{ name, browser_download_url: 'https://example.test/archive', digest }]
      });
    const run = async () => ({ passed: false, detail: 'Archive rejected.' });

    await assert.rejects(
      updateApplication(
        { fetch: async () => metadata(null), run },
        {
          currentVersion: '1.0.0',
          cacheDirectory: root,
          dataDirectory: root
        }
      ),
      /does not have a published SHA-256 digest/
    );

    let request = 0;
    await assert.rejects(
      updateApplication(
        {
          fetch: async () =>
            ++request === 1
              ? metadata(`sha256:${'0'.repeat(64)}`)
              : new Response(new Uint8Array([1, 2, 3])),
          run
        },
        { currentVersion: '1.0.0', cacheDirectory: root, dataDirectory: root }
      ),
      /failed its safety check/
    );

    const bytes = new Uint8Array([4, 5, 6]);
    const digest = createHash('sha256').update(bytes).digest('hex');
    request = 0;
    await assert.rejects(
      updateApplication(
        {
          fetch: async () => (++request === 1 ? metadata(`sha256:${digest}`) : new Response(bytes)),
          run
        },
        { currentVersion: '1.0.0', cacheDirectory: root, dataDirectory: root }
      ),
      /could not be unpacked/
    );
  });
});

test('verified package cannot activate without an installation record', async () => {
  await withFixture('update-record', async (root) => {
    const name = releaseAssetName(process.platform, process.arch);
    const bytes = new Uint8Array([7, 8, 9]);
    const digest = createHash('sha256').update(bytes).digest('hex');
    let request = 0;
    let run = 0;
    const services: UpdateServices = {
      fetch: async () =>
        ++request === 1
          ? response({
              tag_name: 'v9.0.0',
              html_url: 'https://example.test',
              assets: [
                {
                  name,
                  browser_download_url: 'https://example.test/archive',
                  digest: `sha256:${digest}`
                }
              ]
            })
          : new Response(bytes),
      run: async () => {
        run += 1;
        return { passed: true, detail: '' };
      }
    };
    await assert.rejects(
      updateApplication(services, {
        currentVersion: '1.0.0',
        cacheDirectory: root,
        dataDirectory: join(root, 'missing')
      }),
      /installation record is missing/
    );
    assert.equal(run, 1);
  });
});

async function payload(root: string, version: string): Promise<string> {
  const result = join(root, 'payload');
  await mkdir(join(result, 'runtime'), { recursive: true });
  await mkdir(join(result, 'runtime', 'node_modules', 'npm', 'bin'), { recursive: true });
  await mkdir(join(result, 'app', 'dist', 'src'), { recursive: true });
  await mkdir(join(result, 'app', 'profiles'), { recursive: true });
  await mkdir(join(result, 'app', 'public-checks'), { recursive: true });
  await cp(
    process.execPath,
    join(result, 'runtime', process.platform === 'win32' ? 'node.exe' : 'node')
  );
  await writeFile(
    join(result, 'runtime', process.platform === 'win32' ? 'npm.cmd' : 'npm'),
    'npm launcher'
  );
  await writeFile(join(result, 'runtime', 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'npm cli');
  await writeFile(join(result, 'app', 'package.json'), JSON.stringify({ type: 'module', version }));
  for (const file of ['install.js', 'files.js'])
    await cp(join(packageRoot, 'dist', 'src', file), join(result, 'app', 'dist', 'src', file));
  await writeFile(join(result, 'app', 'dist', 'src', 'cli.js'), 'console.log("updated")');
  return result;
}

test('verified update archive installs beside the current version and switches the launcher', async () => {
  await withFixture('update-success', async (root) => {
    const initial = await payload(join(root, 'initial'), '1.0.0');
    const data = join(root, 'data');
    const bin = join(root, 'bin');
    await installPayload(initial, data, bin);

    const stage = join(root, 'release');
    await mkdir(stage, { recursive: true });
    await payload(stage, '1.0.1');
    await cp(join(packageRoot, 'scripts', 'install.mjs'), join(stage, 'install.mjs'));
    const assetName = releaseAssetName(process.platform, process.arch);
    const archive = join(root, assetName);
    const packed = await runCommand(
      'tar',
      ['-czf', archive, '-C', stage, 'install.mjs', 'payload'],
      root,
      30
    );
    assert.equal(packed.passed, true);
    const bytes = await readFile(archive);
    const digest = createHash('sha256').update(bytes).digest('hex');
    let request = 0;
    const services: UpdateServices = {
      fetch: async () => {
        request += 1;
        return request === 1
          ? response({
              tag_name: 'v1.0.1',
              html_url: 'https://example.test',
              assets: [
                {
                  name: assetName,
                  browser_download_url: 'https://example.test/archive',
                  digest: `sha256:${digest}`
                }
              ]
            })
          : new Response(new Uint8Array(bytes), { status: 200 });
      },
      run: runCommand
    };
    const result = await updateApplication(services, {
      currentVersion: '1.0.0',
      dataDirectory: data,
      cacheDirectory: join(root, 'cache'),
      platform: process.platform,
      architecture: process.arch
    });
    assert.equal(result.changed, true);
    assert.match(result.message, /updated from 1\.0\.0 to 1\.0\.1/);
    assert.equal(
      JSON.parse(await readFile(join(data, 'install.json'), 'utf8')).activeVersion,
      '1.0.1'
    );
  });
});
