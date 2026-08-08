/**
 * @file WEB 340 Assignment 2.2 Node.js behavior checks.
 * @author Richard Krasso
 *
 * Public cases supply disclosed and additional inputs to establish that the
 * implementation generalizes. Assertions remain focused on process behavior and
 * returned data rather than a particular module structure.
 */

import { join } from 'node:path';
import { equal, json, runEval, runNode } from '../helpers.mjs';

async function call(root, expression) {
  const modulePath = join(root, 'recipes.js');
  const source = `const recipes=require(process.argv[1]); const value=(${expression}); process.stdout.write(JSON.stringify(value));`;
  const result = await runEval(root, source, [modulePath]);
  equal(result.code, 0, `Module call exit status for ${expression}`);
  return JSON.parse(result.stdout);
}

// Each case is intentionally independent so a report can isolate the exact
// function or behavior that needs attention.
export const cases = {
  async 'create-recipe'(root) {
    equal(
      await call(root, `recipes.createRecipe(['flour','sugar','butter'])`),
      'Recipe created with ingredients: flour, sugar, butter',
      'Recipe result'
    );
    return 'createRecipe accepted an ingredient array and returned the required joined description.';
  },
  async 'set-timer'(root) {
    equal(await call(root, 'recipes.setTimer(7)'), 'Timer set for 7 minutes.', 'Timer result');
    return 'setTimer accepted a minute value and returned the required message with punctuation.';
  },
  async quit(root) {
    equal(await call(root, 'recipes.quit()'), 'Program exited', 'Quit result');
    return 'quit returned the required program-exit message.';
  },
  async 'module-exports'(root) {
    equal(
      await call(root, `Object.keys(recipes).sort()`),
      ['createRecipe', 'quit', 'setTimer'],
      'Exported function names'
    );
    return 'The CommonJS module exported all three required functions.';
  },
  async 'program-and-scripts'(root) {
    const result = await runNode(root, 'index.js');
    equal(result.code, 0, 'Program exit status');
    equal(
      result.stdout.trim().split(/\r?\n/),
      [
        'Recipe created with ingredients: ingredient1, ingredient2',
        'Timer set for 15 minutes.',
        'Program exited'
      ],
      'Program output'
    );
    const packageJson = await json(root, 'package.json');
    equal(packageJson.scripts?.start, 'node index.js', 'Start script');
    equal(packageJson.scripts?.test, 'node tester.js', 'Test script');
    return 'The demonstration program exercised all functions and package.json declared the required scripts.';
  }
};
