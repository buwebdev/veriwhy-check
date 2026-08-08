/**
 * @file WEB 340 Assignment 6.2 HTTP service behavior checks.
 * @author Richard Krasso
 *
 * The suite starts the student's server, sends real HTTP requests, and checks
 * route, method, status, body, persistence, and content-type behavior. It thus
 * measures the externally visible service contract without prescribing how the
 * server is organized internally.
 */

import { spawn } from 'node:child_process';
import { equal } from '../helpers.mjs';

async function withServer(root, operation) {
  // Start the authored entry file with the same private runtime used by the
  // checker, and capture output so an early server failure remains explainable.
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });
  try {
    // Readiness polling avoids a fixed sleep: fast servers proceed immediately,
    // while slow or failed starts remain bounded by the startup timeout.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Server did not start. ${output}`)), 2500);
      child.once('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`Server exited before testing with status ${code}. ${output}`));
      });
      const check = async () => {
        try {
          await fetch('http://127.0.0.1:3000/not-a-route', { signal: AbortSignal.timeout(300) });
          clearTimeout(timer);
          resolve();
        } catch {
          if (child.exitCode === null) setTimeout(check, 75);
        }
      };
      check();
    });
    return await operation();
  } finally {
    // Every case owns a fresh server and always terminates it, preventing state
    // or a listening port from leaking into another requirement.
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('close', resolve));
  }
}

async function request(path, method = 'GET') {
  // A short per-request timeout distinguishes an unresponsive route from a
  // checker hang and keeps the remaining public cases available.
  const response = await fetch(`http://127.0.0.1:3000${path}`, {
    method,
    signal: AbortSignal.timeout(1500)
  });
  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    body: await response.text()
  };
}

export const cases = {
  async 'create-and-confirm'(root) {
    // Exercise both disclosed mutation routes before evaluating read behavior.
    return await withServer(root, async () => {
      equal(
        await request('/create-character?class=Mage&gender=Other&funFact=Reads', 'POST'),
        {
          status: 200,
          contentType: '',
          body: 'Character created'
        },
        'Create-character response'
      );
      equal(
        await request('/confirm-character', 'POST'),
        {
          status: 200,
          contentType: '',
          body: 'Character confirmed'
        },
        'Confirm-character response'
      );
      return 'The server accepted the required POST requests and returned both confirmation messages.';
    });
  },
  async 'view-created-character'(root) {
    // Create and read within one server lifetime to prove state persistence,
    // JSON serialization, and the declared response content type together.
    return await withServer(root, async () => {
      await request('/create-character?class=Rogue&gender=Female&funFact=Quiet', 'POST');
      const viewed = await request('/view-character');
      equal(viewed.status, 200, 'View-character status');
      equal(
        JSON.parse(viewed.body),
        { class: 'Rogue', gender: 'Female', funFact: 'Quiet' },
        'Persisted character'
      );
      if (!viewed.contentType.includes('application/json'))
        throw new Error('View-character response did not declare JSON content.');
      return 'The GET route returned the same character created by the preceding POST request as JSON.';
    });
  },
  async 'method-and-route-boundaries'(root) {
    // Negative cases ensure route matching is intentional rather than a catch-all
    // success response that happens to satisfy the happy path.
    return await withServer(root, async () => {
      equal((await request('/create-character')).status, 404, 'Incorrect-method status');
      equal((await request('/unknown')).status, 404, 'Unknown-route status');
      return 'Unsupported methods and unknown routes returned 404 responses.';
    });
  }
};
