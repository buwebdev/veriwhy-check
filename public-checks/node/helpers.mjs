/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function equal(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
  }
}

export function ok(value, label) {
  if (!value) throw new Error(`${label}: expected a truthy result.`);
}

export async function json(root, path) {
  return JSON.parse(await readFile(join(root, path), 'utf8'));
}

export async function runNode(root, script, args = [], input = '', timeoutMs = 3000) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      env: { ...process.env, CI: 'true' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Node process timed out while running ${script}.`));
    }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
    child.stdin.end(input);
  });
}

export async function runEval(root, source, args = [], timeoutMs = 3000) {
  return await runNode(root, '-e', [source, ...args], '', timeoutMs);
}
