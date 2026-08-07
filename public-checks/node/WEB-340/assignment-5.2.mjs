/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { join } from 'node:path';
import { equal, runEval } from '../helpers.mjs';

async function bake(root, type, ingredients) {
  const modulePath = join(root, 'src', 'pie.js');
  const source = `const {bakePie}=require(process.argv[1]); const logs=[]; console.log=(value)=>logs.push(String(value)); let exitCode=null; process.exit=(code)=>{exitCode=code;}; const value=bakePie(process.argv[2],JSON.parse(process.argv[3])); process.stdout.write(JSON.stringify({value:value??null,logs,exitCode}));`;
  const result = await runEval(root, source, [modulePath, type, JSON.stringify(ingredients)]);
  equal(result.code, 0, `Pie behavior exit status for ${type}`);
  return JSON.parse(result.stdout);
}

export const cases = {
  async 'successful-pies'(root) {
    equal(await bake(root, 'Apple', ['flour', 'sugar', 'butter', 'apples']), {
      value: 'Apple pie was successfully baked!', logs: [], exitCode: null
    }, 'Complete pie result');
    equal(await bake(root, 'Cherry', ['cherries', 'butter', 'flour', 'sugar', 'cinnamon']), {
      value: 'Cherry pie was successfully baked!', logs: [], exitCode: null
    }, 'Extra-ingredient pie result');
    return 'bakePie accepted complete ingredient sets in different orders and returned the required success messages.';
  },
  async 'missing-ingredients'(root) {
    const result = await bake(root, 'Apple', ['sugar', 'apples']);
    equal(result.exitCode, 1, 'Missing-ingredient exit code');
    equal(result.logs, ['Warning: Missing essential ingredients: flour, butter'], 'Missing-ingredient warning');
    return 'Missing essential ingredients produced the required warning and requested process exit status 1.';
  }
};
