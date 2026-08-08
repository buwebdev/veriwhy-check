/**
 * @file Shell-free child-process execution with bounded output and timeouts.
 * @author Richard Krasso
 *
 * The runner passes an executable and argument array directly to the operating
 * system. It never evaluates a shell command string from a profile.
 */

import { spawn } from 'node:child_process';
import { win32 } from 'node:path';
import { headlessShellExecutablePath } from './browser-runtime.js';
import type { ExecutionResult } from './types.js';

export interface ProcessInvocation {
  /** Executable passed directly to the operating system. */
  executable: string;
  /** Argument boundaries preserved without shell parsing. */
  args: string[];
}

/** Run Windows package managers through bundled Node.js without a shell. */
export function platformInvocation(
  executable: string,
  args: string[],
  platform: NodeJS.Platform = process.platform,
  nodeExecutable = process.execPath
): ProcessInvocation {
  if (platform !== 'win32' || (executable !== 'npm' && executable !== 'npx'))
    return { executable, args };
  // Windows npm launchers are command scripts, which normally require a shell.
  // Invoking npm-cli.js with bundled Node preserves the no-shell guarantee.
  const cli = win32.join(
    win32.dirname(nodeExecutable),
    'node_modules',
    'npm',
    'bin',
    `${executable}-cli.js`
  );
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
  // ANSI sequences add noise to HTML reports and may visually conceal text, so
  // they are removed before any error line is selected.
  const clean = output.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
  const lines = clean
    .split(/\r?\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);
  const important = lines.filter(
    (line) =>
      /\b(?:fail(?:ed|ure)?|error|expected|cannot|missing|not found|exception)\b/i.test(line) &&
      !/Executed \d+ of \d+/i.test(line)
  );
  // Prefer lines that communicate cause. If a tool uses unfamiliar wording,
  // retain its final twelve lines as a bounded diagnostic fallback.
  const selected = (important.length ? important : lines.slice(-12)).slice(-12);
  const unique = selected.filter((line, index) => selected.indexOf(line) === index);
  return (
    unique.join('\n').slice(-5000) ||
    (signal ? `Stopped by ${signal}.` : `Exited with status ${String(code)}.`)
  );
}

/** Execute one bounded process and collect only a small tail of its output. */
export async function runCommand(
  executable: string,
  args: string[],
  cwd: string,
  timeoutSeconds: number
): Promise<ExecutionResult> {
  return await new Promise((resolveResult) => {
    // Normalize platform behavior once, then spawn with an argument array and
    // ignored stdin so a check cannot become an interactive terminal process.
    const invocation = platformInvocation(executable, args);
    const child = spawn(invocation.executable, invocation.args, {
      cwd,
      // Angular's Karma launcher uses the same isolated Playwright Chromium
      // binary as browser checks. No system Chrome installation is required.
      env: {
        ...process.env,
        CHROME_BIN: process.env.CHROME_BIN ?? headlessShellExecutablePath(),
        CI: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let timedOut = false;
    let settled = false;
    const complete = (result: ExecutionResult): void => {
      // Both `error` and `close` may fire for one failed spawn. This guard makes
      // the promise settle exactly once and keeps cleanup deterministic.
      if (settled) return;
      settled = true;
      resolveResult(result);
    };
    const collect = (chunk: Buffer): void => {
      // Preserve only the newest 16 KB. Build tools can emit megabytes, but the
      // report needs a useful tail rather than unbounded memory growth.
      output = `${output}${chunk.toString()}`.slice(-16000);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => {
      // SIGTERM requests an orderly shutdown. The close handler owns the final
      // learner-facing timeout result after the process actually exits.
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
        complete({
          passed: false,
          detail: `Command exceeded ${timeoutSeconds} seconds and was stopped.`
        });
        return;
      }
      const passed = code === 0;
      complete({ passed, detail: summarizeCommandOutput(output, passed, code, signal) });
    });
  });
}
