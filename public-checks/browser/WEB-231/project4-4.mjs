/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

async function calculate(page, cash, bill) {
  await page.locator('#cash').fill(String(cash));
  await page.locator('#bill').fill(String(bill));
  await page.locator('#bill').dispatchEvent('change');
}

async function register(page) {
  const value = async (selector) => normalized(await page.locator(selector).inputValue());
  const text = async (selector) => normalized(await page.locator(selector).textContent());
  return {
    change: (await value('#change')).replace(/^\$/, ''),
    warning: await text('#warning'),
    bill20: await text('#bill20'),
    bill10: await text('#bill10'),
    bill5: await text('#bill5'),
    bill1: await text('#bill1'),
    coin25: await text('#coin25'),
    coin10: await text('#coin10'),
    coin5: await text('#coin5'),
    coin1: await text('#coin1')
  };
}

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of ['#cash', '#bill', '#change', '#warning', '#bill20', '#bill10', '#bill5', '#bill1', '#coin25', '#coin10', '#coin5', '#coin1']) {
      equal(await page.locator(selector).count(), 1, `${selector} element count`);
    }
    return 'The change calculator loaded without syntax, runtime, or console errors.';
  },
  async 'textbook-example'(page) {
    await calculate(page, 20, 12.31);
    equal(await register(page), {
      change: '7.69', warning: '', bill20: '0', bill10: '0', bill5: '1', bill1: '2', coin25: '2', coin10: '1', coin5: '1', coin1: '4'
    }, 'Change for a $20.00 payment on a $12.31 bill');
    return 'The textbook example produced $7.69 using the correct bills and coins.';
  },
  async 'generalized-change'(page) {
    await calculate(page, 50, 16.37);
    equal(await register(page), {
      change: '33.63', warning: '', bill20: '1', bill10: '1', bill5: '0', bill1: '3', coin25: '2', coin10: '1', coin5: '0', coin1: '3'
    }, 'Change for a $50.00 payment on a $16.37 bill');
    return 'A second payment and bill combination produced the correct generalized result.';
  },
  async 'insufficient-cash'(page) {
    await calculate(page, 10, 12.31);
    const result = await register(page);
    equal(result.warning.replace('doesn’t', "doesn't"), "Cash amount doesn't cover the bill", 'Insufficient-cash warning');
    equal(result.change, '0', 'Change after insufficient cash');
    for (const key of ['bill20', 'bill10', 'bill5', 'bill1', 'coin25', 'coin10', 'coin5', 'coin1']) equal(result[key], '0', `${key} after insufficient cash`);
    return 'An insufficient payment displayed the required warning and did not calculate change.';
  }
};
