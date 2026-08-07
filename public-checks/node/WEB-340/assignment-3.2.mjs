/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { join } from 'node:path';
import { equal, runEval } from '../helpers.mjs';

async function calculate(root, first, second) {
  const modulePath = join(root, 'src', 'distance-calculator.js');
  const source = `const calculate=require(process.argv[1]); try { process.stdout.write(JSON.stringify({value:calculate(process.argv[2],process.argv[3])})); } catch (error) { process.stdout.write(JSON.stringify({error:error.message})); }`;
  const result = await runEval(root, source, [modulePath, first, second]);
  equal(result.code, 0, `Distance calculation exit status for ${first} and ${second}`);
  return JSON.parse(result.stdout);
}

export const cases = {
  async 'planet-distances'(root) {
    equal(await calculate(root, 'Earth', 'Mars'), { value: 0.52 }, 'Earth-to-Mars distance');
    equal(await calculate(root, 'Jupiter', 'Earth'), { value: 4.2 }, 'Jupiter-to-Earth distance');
    equal(await calculate(root, 'Earth', 'Earth'), { value: 0 }, 'Same-planet distance');
    return 'The module calculated representative, reversed, and same-planet distances in astronomical units.';
  },
  async 'invalid-planets'(root) {
    equal(await calculate(root, 'Earth', 'Pluto'), { error: 'Invalid planet name' }, 'Invalid-planet result');
    return 'The module rejected an unknown planet with the required error.';
  }
};
