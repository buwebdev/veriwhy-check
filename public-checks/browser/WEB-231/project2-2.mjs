/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors } from '../helpers.mjs';

async function submit(page, values) {
  for (const field of ['name', 'email', 'phone']) await page.locator(`#${field}`).fill(values[field] ?? '');
  const dialogPromise = page.waitForEvent('dialog', { timeout: 2000 });
  const clickPromise = page.locator('#submit').click();
  let dialog;
  try {
    dialog = await dialogPromise;
  } catch {
    await clickPromise;
    throw new Error('Clicking the Submit button did not display an alert.');
  }
  const message = dialog.message();
  await dialog.accept();
  await clickPromise;
  return message;
}

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of ['#name', '#email', '#phone', '#submit']) {
      equal(await page.locator(selector).count(), 1, `${selector} control count`);
    }
    return 'The form loaded without browser errors and exposed all required controls.';
  },
  async 'blank-form'(page) {
    equal(await submit(page, {}), 'Please fill in all fields', 'Blank-form alert');
    return 'Submitting a blank form displayed the required incomplete-form message.';
  },
  async 'partial-forms'(page) {
    const complete = { name: 'Ada', email: 'ada@example.edu', phone: '555-0100' };
    for (const missing of ['name', 'email', 'phone']) {
      await page.reload({ waitUntil: 'load' });
      equal(await submit(page, { ...complete, [missing]: '' }), 'Please fill in all fields', `Alert with missing ${missing}`);
    }
    return 'Each missing required field displayed the incomplete-form message.';
  },
  async 'complete-form'(page) {
    equal(
      await submit(page, { name: 'Ada', email: 'ada@example.edu', phone: '555-0100' }),
      'Thank you!',
      'Complete-form alert'
    );
    return 'Submitting values in all three fields displayed the required thank-you message.';
  }
};
