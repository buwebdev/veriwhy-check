/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { spawn } from 'node:child_process';
import { equal } from '../helpers.mjs';

async function withServer(root, operation) {
  const child = spawn(process.execPath, ['src/server.js'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  try {
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
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('close', resolve));
  }
}

async function request(path, method = 'GET') {
  const response = await fetch(`http://127.0.0.1:3000${path}`, { method, signal: AbortSignal.timeout(1500) });
  return { status: response.status, contentType: response.headers.get('content-type') ?? '', body: await response.text() };
}

export const cases = {
  async 'create-and-confirm'(root) {
    return await withServer(root, async () => {
      equal(await request('/create-character?class=Mage&gender=Other&funFact=Reads', 'POST'), {
        status: 200, contentType: '', body: 'Character created'
      }, 'Create-character response');
      equal(await request('/confirm-character', 'POST'), {
        status: 200, contentType: '', body: 'Character confirmed'
      }, 'Confirm-character response');
      return 'The server accepted the required POST requests and returned both confirmation messages.';
    });
  },
  async 'view-created-character'(root) {
    return await withServer(root, async () => {
      await request('/create-character?class=Rogue&gender=Female&funFact=Quiet', 'POST');
      const viewed = await request('/view-character');
      equal(viewed.status, 200, 'View-character status');
      equal(JSON.parse(viewed.body), { class: 'Rogue', gender: 'Female', funFact: 'Quiet' }, 'Persisted character');
      if (!viewed.contentType.includes('application/json')) throw new Error('View-character response did not declare JSON content.');
      return 'The GET route returned the same character created by the preceding POST request as JSON.';
    });
  },
  async 'method-and-route-boundaries'(root) {
    return await withServer(root, async () => {
      equal((await request('/create-character')).status, 404, 'Incorrect-method status');
      equal((await request('/unknown')).status, 404, 'Unknown-route status');
      return 'Unsupported methods and unknown routes returned 404 responses.';
    });
  }
};
