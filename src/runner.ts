/**
 * @file Shell-free child-process execution with bounded output and timeouts.
 * @author Richard Krasso
 *
 * The runner passes an executable and argument array directly to the operating
 * system. It never evaluates a shell command string from a profile.
 */

import { spawn } from 'node:child_process';
import { win32 } from 'node:path';
import { chromium } from 'playwright';
import type { ExecutionResult } from './types.js';

export interface ProcessInvocation { executable: string; args: string[] }

/** Run Windows package managers through bundled Node.js without a shell. */
export function platformInvocation(
  executable: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
  nodeExecutable = process.execPath
): ProcessInvocation {
  if (platform !== 'win32' || (executable !== 'npm' && executable !== 'npx')) return { executable, args };
  const cli = win32.join(win32.dirname(nodeExecutable), 'node_modules', 'npm', 'bin', `${executable}-cli.js`);
  return { executable: nodeExecutable, args: [cli, ...args] };
}

/** Remove terminal control sequences and select the most useful failure lines. */
export function summarizeCommandOutput(
  output: string,
  passed: boolean,
  code: number | null,
  signal: NodeJS.Signals | null
): string {
  if (passed) return 'Command completed successfully.';
  const clean = output.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
  const lines = clean.split(/\r?\n|\r/).map((line) => line.trim()).filter(Boolean);
  const important = lines.filter((line) =>
    /\b(?:fail(?:ed|ure)?|error|expected|cannot|missing|not found|exception)\b/i.test(line) &&
    !/Executed \d+ of \d+/i.test(line)
  );
  const selected = (important.length ? important : lines.slice(-12)).slice(-12);
  const unique = selected.filter((line, index) => selected.indexOf(line) === index);
  return unique.join('\n').slice(-5000) || (signal ? `Stopped by ${signal}.` : `Exited with status ${String(code)}.`);
}

/** Execute one bounded process and collect only a small tail of its output. */
export async function runCommand(
  executable: string,
  args: string[],
  cwd: string,
  timeoutSeconds: number
): Promise<ExecutionResult> {
  return await new Promise((resolveResult) => {
    const invocation = platformInvocation(executable, args);
    const child = spawn(invocation.executable, invocation.args, {
      cwd,
      // Angular's Karma launcher uses the same isolated Playwright Chromium
      // binary as browser checks. No system Chrome installation is required.
      env: { ...process.env, CHROME_BIN: process.env.CHROME_BIN ?? chromium.executablePath(), CI: 'true' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let timedOut = false;
    let settled = false;
    const complete = (result: ExecutionResult): void => {
      if (settled) return;
      settled = true;
      resolveResult(result);
    };
    const collect = (chunk: Buffer): void => {
      output = `${output}${chunk.toString()}`.slice(-16000);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutSeconds * 1000);
    child.on('error', (error) => {
      clearTimeout(timer);
      complete({ passed: false, detail: error.message });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        complete({ passed: false, detail: `Command exceeded ${timeoutSeconds} seconds and was stopped.` });
        return;
      }
      const passed = code === 0;
      complete({ passed, detail: summarizeCommandOutput(output, passed, code, signal) });
    });
  });
}
