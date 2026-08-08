/**
 * @file Isolated local web server and managed-browser public-check runner.
 * @author Richard Krasso
 *
 * The server exposes only the temporary project on a loopback address. A new
 * nonpersistent Chromium context blocks every external network request and has
 * no relationship to the student's normal browser profile.
 */

import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import type { BrowserCase, BrowserState } from './check-api.js';
import { isInside, pathExists } from './files.js';
import { publicChecksRoot } from './paths.js';
import { withTimeout } from './node-check.js';
import type { ExecutionResult } from './types.js';

/** Public check module shape loaded from the application package. */
interface BrowserCheckModule {
  cases?: Record<string, BrowserCase>;
}

/** Content types sufficient for the supported static coursework projects. */
const contentTypes: Record<string, string> = {
  // The allowlist covers only formats used by supported assignments. Unknown
  // extensions are served as opaque bytes rather than guessed executable data.
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.htm': 'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

/** Start a loopback-only static server rooted at the temporary project. */
export async function startStaticServer(
  root: string,
  entry: string
): Promise<{ server: Server; origin: string }> {
  const resolvedRoot = resolve(root);
  const server = createServer(async (request, response) => {
    try {
      // URL parsing and decoding occur before path resolution so encoded `..`
      // segments cannot bypass the project-containment comparison below.
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requested = decodeURIComponent(requestUrl.pathname);
      const relativePath = requested === '/' ? entry : requested.replace(/^\/+/, '');
      const file = resolve(resolvedRoot, relativePath);
      if (!isInside(resolvedRoot, file) || !(await stat(file)).isFile()) {
        // Use the same 404 response for missing and forbidden paths. Revealing
        // which parent paths exist would weaken the temporary-root boundary.
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      response.writeHead(200, {
        // Disabling the cache ensures every case observes the copied submission
        // as it exists for this run rather than a prior browser response.
        'Cache-Control': 'no-store',
        'Content-Type': contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream'
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  // Port zero asks the operating system for an unused ephemeral port. This
  // permits parallel checks without reserving or documenting a fixed port.
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('The local check server did not provide a port.');
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

/** Close a local server and wait until its port is released. */
export async function closeStaticServer(server: Server): Promise<void> {
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
}

/** Sanitize browser failures before placing them in a student report. */
export function cleanBrowserError(error: unknown, projectRoot: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replaceAll(projectRoot, 'selected project')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

/** Load and run one named browser case with external requests blocked. */
export async function runBrowserCheck(
  projectRoot: string,
  entry: string,
  test: string,
  caseName: string,
  timeoutSeconds: number,
  checksRoot = join(publicChecksRoot, 'browser')
): Promise<ExecutionResult> {
  if (!(await pathExists(join(projectRoot, entry))))
    return { passed: false, detail: `Missing required entry page: ${entry}.` };
  const modulePath = join(checksRoot, `${test}.mjs`);
  // Only a module located beneath the packaged public-check root can load. The
  // validated profile supplies a safe relative path, never an import URL.
  if (!(await pathExists(modulePath)))
    return { passed: false, detail: 'The selected public browser check is unavailable.' };

  let server: Server | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    // The cache-busting query prevents module-level state from leaking between
    // repeated checks in the same process.
    const loaded = (await import(
      `${pathToFileURL(modulePath).href}?run=${Date.now()}`
    )) as BrowserCheckModule;
    const selectedCase = loaded.cases?.[caseName];
    if (typeof selectedCase !== 'function')
      return { passed: false, detail: 'The selected public browser check case is unavailable.' };
    const local = await startStaticServer(projectRoot, entry);
    server = local.server;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    // A fresh nonpersistent context has no cookies, history, extensions, saved
    // passwords, or relationship to any browser the student normally uses.
    await context.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.startsWith(local.origin) || url.startsWith('data:') || url.startsWith('blob:'))
        await route.continue();
      else await route.abort('blockedbyclient');
    });
    // Only loopback and in-document data/blob resources are permitted. Blocking
    // every other request protects privacy and makes checks reproducible offline.
    const page = await context.newPage();
    page.setDefaultTimeout(Math.min(timeoutSeconds * 1000, 15_000));
    const state: BrowserState = { pageErrors: [], consoleErrors: [] };
    page.on('pageerror', (error) => state.pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') state.consoleErrors.push(message.text());
    });
    await page.goto(`${local.origin}/`, { waitUntil: 'load', timeout: timeoutSeconds * 1000 });
    // Navigation completes before the named assessment case begins so every
    // public case receives the same initialized page lifecycle.
    const detail = await withTimeout(selectedCase(page, state), timeoutSeconds, 'Browser check');
    return {
      passed: true,
      detail: typeof detail === 'string' && detail ? detail : 'Required browser behavior passed.'
    };
  } catch (error) {
    return { passed: false, detail: cleanBrowserError(error, projectRoot) };
  } finally {
    // Browser and server cleanup must run on passes, failures, and timeouts so a
    // check never leaves a background process or listening port behind.
    await browser?.close();
    if (server) await closeStaticServer(server);
  }
}
