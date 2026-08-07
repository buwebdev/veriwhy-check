/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, runNode } from '../helpers.mjs';

async function conversion(root, pounds, expected) {
  const result = await runNode(root, 'weight-converter.js', [pounds]);
  equal(result.code, 0, `Exit status for ${pounds} pounds`);
  equal(result.stdout.trim(), expected, `Conversion for ${pounds} pounds`);
  equal(result.stderr.trim(), '', `Error output for ${pounds} pounds`);
}

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
