/**
 * @file WEB 231 Assignment 4.2 browser behavior checks.
 * @author Richard Krasso
 *
 * Cases verify the published form, browser health, and computed visible output.
 * The assessment is black-box by design, allowing different correct solutions
 * while rejecting missing interactions and incorrect results.
 */

import { currency, equal, noBrowserErrors, text } from '../helpers.mjs';

const prices = { item1: 11.95, item2: 13.95, item3: 10.95, item4: 17.95, item5: 8.95 };

async function select(page, ids) {
  for (const id of Object.keys(prices)) {
    const checkbox = page.locator(`#${id}`);
    if (ids.includes(id)) await checkbox.check();
    else await checkbox.uncheck();
  }
}

async function assertTotal(page, ids, label) {
  const expected = ids.reduce((total, id) => total + prices[id], 0);
  equal(await text(page, '#billTotal'), currency(expected), label);
}

// The YAML profile chooses one name at a time, preserving a direct, auditable
// mapping from assignment language to browser evidence.
export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    equal(await page.locator('.menuItem').count(), 5, 'Menu-item count');
    equal(await text(page, '#billTotal'), '$0', 'Initial order total');
    return 'The order page loaded without browser errors and displayed five menu choices.';
  },
  async 'individual-items'(page) {
    for (const id of Object.keys(prices)) {
      await page.reload({ waitUntil: 'load' });
      await select(page, [id]);
      await assertTotal(page, [id], `${id} order total`);
    }
    return 'Every individual menu choice produced the correct order total.';
  },
  async 'combined-items'(page) {
    const ids = ['item1', 'item3', 'item5'];
    await select(page, ids);
    await assertTotal(page, ids, 'Combined order total');
    return 'A multi-item selection produced the correct order total.';
  },
  async deselection(page) {
    await select(page, ['item1', 'item2', 'item4']);
    await page.locator('#item2').uncheck();
    await assertTotal(page, ['item1', 'item4'], 'Updated order total');
    return 'Deselecting an item removed its price from the displayed total.';
  },
  async 'all-items'(page) {
    const ids = Object.keys(prices);
    await select(page, ids);
    await assertTotal(page, ids, 'All-item order total');
    return 'Selecting every menu item produced the correct total.';
  }
};
