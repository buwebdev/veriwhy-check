/**
 * @file WEB 340 Assignment 1.3 Node.js behavior checks.
 * @author Richard Krasso
 *
 * The cases execute the submitted program with the checker's private Node.js
 * runtime and compare observable results. They do not grade source formatting,
 * naming preferences, comments, or undocumented implementation details.
 */

import { equal, runNode } from '../helpers.mjs';

async function conversion(root, pounds, expected) {
  const result = await runNode(root, 'weight-converter.js', [pounds]);
  equal(result.code, 0, `Exit status for ${pounds} pounds`);
  equal(result.stdout.trim(), expected, `Conversion for ${pounds} pounds`);
  equal(result.stderr.trim(), '', `Error output for ${pounds} pounds`);
}

// YAML selects cases by these stable names, preserving a direct mapping from the
// published assignment contract to executable Node.js evidence.
export const cases = {
  async 'representative-conversions'(root) {
    await conversion(root, '10', '4.54');
    await conversion(root, '2.5', '1.13');
    await conversion(root, '0', '0.00');
    return 'The CLI converted whole-number, decimal, and zero-pound inputs to two-decimal kilogram values.';
  },
  async 'missing-input'(root) {
    const result = await runNode(root, 'weight-converter.js');
    equal(result.code, 1, 'Missing-input exit status');
    equal(result.stderr.trim(), 'Usage: node weight-converter.js <pounds>', 'Missing-input error');
    return 'Running without a weight produced the required usage message on stderr and exited unsuccessfully.';
  },
  async 'invalid-input'(root) {
    const result = await runNode(root, 'weight-converter.js', ['not-a-number']);
    equal(result.code, 1, 'Invalid-input exit status');
    equal(result.stderr.trim(), 'Input must be a number', 'Invalid-input error');
    return 'A nonnumeric weight produced the required error on stderr and exited unsuccessfully.';
  }
};
