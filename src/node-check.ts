/**
 * @file Loader and timeout boundary for public Node.js behavior checks.
 * @author Richard Krasso
 *
 * Check modules receive only the temporary project path. Errors are sanitized
 * so reports do not expose installation or instructor workspace details.
 */

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NodeCase } from './check-api.js';
import { pathExists } from './files.js';
import { publicChecksRoot } from './paths.js';
import type { ExecutionResult } from './types.js';

/** Shape of a public Node.js check module. */
interface NodeCheckModule {
  cases?: Record<string, NodeCase>;
}

/** Replace private absolute paths and bound the reportable error length. */
export function cleanNodeCheckError(error: unknown, projectRoot: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replaceAll(projectRoot, 'selected project').replace(/\s+/g, ' ').trim().slice(0, 1000);
}

/** Apply a timeout to a promise without leaving its timer active. */
export async function withTimeout<T>(operation: Promise<T>, seconds: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} exceeded ${seconds} seconds.`)), seconds * 1000);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Load and execute one named public Node.js case. */
export async function runNodeCheck(
  projectRoot: string,
  test: string,
  caseName: string,
  timeoutSeconds: number,
  checksRoot = join(publicChecksRoot, 'node')
): Promise<ExecutionResult> {
  const modulePath = join(checksRoot, `${test}.mjs`);
  if (!await pathExists(modulePath)) return { passed: false, detail: 'The selected public Node.js check is unavailable.' };
  try {
    const loaded = await import(`${pathToFileURL(modulePath).href}?run=${Date.now()}`) as NodeCheckModule;
    const selectedCase = loaded.cases?.[caseName];
    if (typeof selectedCase !== 'function') return { passed: false, detail: 'The selected public Node.js check case is unavailable.' };
    const detail = await withTimeout(selectedCase(projectRoot), timeoutSeconds, 'Node.js check');
    return { passed: true, detail: typeof detail === 'string' && detail ? detail : 'Required Node.js behavior passed.' };
  } catch (error) {
    return { passed: false, detail: cleanNodeCheckError(error, projectRoot) };
  }
}
