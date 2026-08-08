/**
 * @file WEB 340 Assignment 4.2 Node.js behavior checks.
 * @author Richard Krasso
 *
 * These cases verify the published input/output behavior and required boundary
 * conditions. The tests avoid coupling assessment to the reference solution's
 * identifiers, whitespace, or file-internal organization.
 */

import { join } from 'node:path';
import { equal, runEval, runNode } from '../helpers.mjs';

async function event(root, method, name, value) {
  const modulePath = join(root, 'src', 'taco-stand.js');
  const source = `const TacoStand=require(process.argv[1]); const stand=new TacoStand(); let received; stand.on(process.argv[2], value => { received=value; }); stand[process.argv[3]](process.argv[4]); process.stdout.write(JSON.stringify({received,isEmitter:typeof stand.emit==='function'}));`;
  const result = await runEval(root, source, [modulePath, name, method, value]);
  equal(result.code, 0, `${name} event exit status`);
  equal(JSON.parse(result.stdout), { received: value, isEmitter: true }, `${name} event payload`);
}

// Independent public cases generate focused evidence instead of collapsing all
// behaviors into one pass/fail outcome.
export const cases = {
  async 'event-emitter-behavior'(root) {
    await event(root, 'serveCustomer', 'serve', 'Ada');
    await event(root, 'prepareTaco', 'prepare', 'chicken');
    await event(root, 'handleRush', 'rush', 'dinner');
    return 'TacoStandEmitter inherited event behavior and emitted all three required event names and payloads.';
  },
  async 'cli-commands'(root) {
    for (const [input, expected] of [
      ['serve John\n', 'Taco Stand serves: John'],
      ['prepare beef\n', 'Taco Stand prepares: beef taco'],
      ['rush lunch\n', 'Taco Stand handles rush: lunch']
    ]) {
      const result = await runNode(root, 'src/index.js', [], input);
      equal(result.code, 0, `CLI exit status for ${input.trim()}`);
      if (!result.stdout.includes(expected))
        throw new Error(`CLI output for ${input.trim()}: expected ${expected}.`);
    }
    return 'The CLI accepted serve, prepare, and rush commands and printed the required event results.';
  }
};
