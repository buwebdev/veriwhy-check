/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

const values = {
  riderName: 'Ada Rider',
  ageGroup: '31 - 40',
  bikeOption: 'mountain',
  routeOption: 'trail',
  accOption: 'camping',
  region: 'Northwest',
  miles: '81 - 100',
  comments: 'Morning rides'
};

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of [...Object.keys(values).map((id) => `#${id}`), '#submitButton']) {
      equal(await page.locator(selector).count(), 1, `${selector} control count`);
    }
    return 'The rider form loaded without browser errors and exposed all required fields.';
  },
  async 'session-storage-transfer'(page) {
    for (const [id, value] of Object.entries(values)) {
      const control = page.locator(`#${id}`);
      if (id === 'riderName' || id === 'comments') await control.fill(value);
      else await control.selectOption(value);
    }
    await Promise.all([
      page.waitForURL(/project09-02b\.html$/),
      page.locator('#submitButton').click()
    ]);
    for (const [id, expected] of Object.entries(values)) {
      equal(normalized(await page.locator(`#${id}`).textContent()), expected, `${id} result`);
      equal(await page.evaluate((key) => sessionStorage.getItem(key), id), expected, `${id} stored value`);
    }
    return 'All eight rider values persisted through session storage, navigation, and results-page rendering.';
  }
};
