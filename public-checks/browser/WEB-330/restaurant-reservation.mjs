/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

async function submit(page, tableNumber) {
  await page.locator('#name').fill('Ada');
  await page.locator('#tableNumber').fill(String(tableNumber));
  await page.locator('#reservationForm input[type="submit"]').click();
}

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of ['#reservationForm', '#name', '#tableNumber', '#message']) {
      equal(await page.locator(selector).count(), 1, `${selector} element count`);
    }
    return 'The reservation form loaded without browser errors and exposed its inputs and message output.';
  },
  async 'callback-delay'(page) {
    const result = await page.evaluate(async () => await new Promise((resolve) => {
      const started = performance.now();
      reserveTable(2, (message) => resolve({ message, elapsed: performance.now() - started }), 40);
    }));
    equal(result.message, 'Table number 2 has been successfully reserved.', 'Reservation callback message');
    if (result.elapsed < 30) throw new Error('The available-table callback did not wait for the requested delay.');
    return 'reserveTable waited for its supplied delay before invoking the success callback.';
  },
  async 'available-and-reserved'(page) {
    await submit(page, 1);
    await page.waitForFunction(() => document.querySelector('#message')?.textContent.includes('successfully reserved'));
    equal(normalized(await page.locator('#message').textContent()), 'Table number 1 has been successfully reserved.', 'Available-table message');
    await submit(page, 1);
    equal(normalized(await page.locator('#message').textContent()), 'Table number 1 is already reserved.', 'Reserved-table message');
    return 'The form displayed the delayed success message and immediately rejected a duplicate reservation.';
  },
  async 'unknown-table'(page) {
    await submit(page, 99);
    equal(normalized(await page.locator('#message').textContent()), 'Table number 99 does not exist.', 'Unknown-table message');
    return 'An unknown table number produced the required error callback and page message.';
  }
};
