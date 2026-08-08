/**
 * @file Shared process, fixture, and assertion helpers for Node.js checks.
 * @author Richard Krasso
 *
 * These helpers execute only files inside the disposable project copy. They
 * preserve argument boundaries, bound execution time, capture both output
 * streams, and return evidence to a named public check instead of interpreting
 * code style or undocumented implementation choices.
 */

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function equal(actual, expected, label) {
  // JSON comparison is sufficient for the course's plain serializable values
  // and yields a readable expected-versus-observed message for students.
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`
    );
  }
}

export function ok(value, label) {
  // Named truth assertions are reserved for public requirements whose exact
  // representation may vary while their observable condition remains stable.
  if (!value) throw new Error(`${label}: expected a truthy result.`);
}

export async function json(root, path) {
  // Joining to the temporary root keeps fixture reading within the copied
  // submission; profile validation separately constrains public paths.
  return JSON.parse(await readFile(join(root, path), 'utf8'));
}

export async function runNode(root, script, args = [], input = '', timeoutMs = 3000) {
  return await new Promise((resolve, reject) => {
    // Use the checker's private Node runtime rather than a student's global
    // installation so execution matches the supported release environment.
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      env: { ...process.env, CI: 'true' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    const timer = setTimeout(() => {
      // A bounded check prevents an accidental server or input loop from
      // blocking the remaining requirements indefinitely.
      child.kill('SIGTERM');
      reject(new Error(`Node process timed out while running ${script}.`));
    }, timeoutMs);
    child.on('close', (code, signal) => {
      // Resolve with raw observations; the named assignment case decides which
      // exit code and output constitute its disclosed functional behavior.
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr });
    });
    child.stdin.end(input);
  });
}

export async function runEval(root, source, args = [], timeoutMs = 3000) {
  // Inline evaluation is used only for small public adapters around exported
  // student functions; it avoids writing any test file into the original work.
  return await runNode(root, '-e', [source, ...args], '', timeoutMs);
}
