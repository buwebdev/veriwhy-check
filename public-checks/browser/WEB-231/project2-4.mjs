/**
 * @file WEB 231 Assignment 3.2 browser behavior checks.
 * @author Richard Krasso
 *
 * The checker drives user-facing inputs and observes displayed results. Multiple
 * data points demonstrate functional generalization without requiring a chosen
 * loop, function name, formatting style, or file organization.
 */

import { currency, equal, noBrowserErrors, text } from '../helpers.mjs';

const prices = { chicken: 10.95, halibut: 13.95, burger: 9.95, salmon: 18.95, salad: 7.95 };

async function select(page, ids) {
  for (const id of Object.keys(prices)) {
    const checkbox = page.locator(`#${id}`);
    if (ids.includes(id)) await checkbox.check();
    else await checkbox.uncheck();
  }
}

async function assertTotals(page, ids, label) {
  const cost = ids.reduce((total, id) => total + prices[id], 0);
  const tax = cost * 0.07;
  equal(await text(page, '#foodTotal'), currency(cost), `${label} food total`);
  equal(await text(page, '#foodTax'), currency(tax), `${label} tax`);
  equal(await text(page, '#totalBill'), currency(cost + tax), `${label} bill total`);
}

// Named cases remain small and independent so one failed scenario does not hide
// useful evidence from a different published requirement.
export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of [
      '#chicken',
      '#halibut',
      '#burger',
      '#salmon',
      '#salad',
      '#foodTotal',
      '#foodTax',
      '#totalBill'
    ]) {
      equal(await page.locator(selector).count(), 1, `${selector} element count`);
    }
    return 'The order page loaded without browser errors and exposed the required inputs and outputs.';
  },
  async 'individual-items'(page) {
    for (const id of Object.keys(prices)) {
      await page.reload({ waitUntil: 'load' });
      await select(page, [id]);
      await assertTotals(page, [id], id);
    }
    return 'Every individual menu choice produced the correct subtotal, tax, and total.';
  },
  async 'combined-items'(page) {
    const ids = ['chicken', 'burger', 'salad'];
    await select(page, ids);
    await assertTotals(page, ids, 'Combined order');
    return 'A multi-item order produced the correct subtotal, tax, and total.';
  },
  async deselection(page) {
    await select(page, ['chicken', 'halibut', 'salmon']);
    await page.locator('#halibut').uncheck();
    await assertTotals(page, ['chicken', 'salmon'], 'Updated order');
    return 'Removing an item recalculated every displayed amount correctly.';
  },
  async 'all-items'(page) {
    const ids = Object.keys(prices);
    await select(page, ids);
    await assertTotals(page, ids, 'All-item order');
    return 'Selecting every menu item produced the correct subtotal, tax, and total.';
  }
};
