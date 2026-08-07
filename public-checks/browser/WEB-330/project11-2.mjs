/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors } from '../helpers.mjs';

async function lookup(page, country, postalCode, response) {
  let requested = '';
  await page.route('http://api.zippopotam.us/**', async (route) => {
    requested = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });
  await page.locator('#country').selectOption(country);
  await page.locator('#postalCode').fill(postalCode);
  await page.locator('#postalCode').blur();
  await page.waitForFunction(() => document.querySelector('#place')?.value.length > 0);
  return {
    requested,
    place: await page.locator('#place').inputValue(),
    region: await page.locator('#region').inputValue()
  };
}

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of ['#country', '#postalCode', '#place', '#region']) {
      equal(await page.locator(selector).count(), 1, `${selector} control count`);
    }
    return 'The postal-code form loaded without browser errors and exposed all required controls.';
  },
  async 'us-lookup'(page) {
    equal(await lookup(page, 'us', '01101', {
      places: [{ 'place name': 'Springfield', 'state abbreviation': 'MA' }]
    }), {
      requested: 'http://api.zippopotam.us/us/01101', place: 'Springfield', region: 'MA'
    }, 'United States lookup');
    return 'The blur handler requested the selected country and postal code and displayed the returned US place and region.';
  },
  async 'international-lookup'(page) {
    equal(await lookup(page, 'es', '30151', {
      places: [{ 'place name': 'Santo Angel', 'state abbreviation': 'MU' }]
    }), {
      requested: 'http://api.zippopotam.us/es/30151', place: 'Santo Angel', region: 'MU'
    }, 'Spain lookup');
    return 'The same Fetch workflow supported a second country and rendered its returned place and region.';
  },
  async 'rejected-request'(page) {
    const logs = [];
    page.on('console', (message) => { if (message.type() === 'log') logs.push(message.text()); });
    await page.route('http://api.zippopotam.us/**', (route) => route.abort('failed'));
    await page.locator('#postalCode').fill('00000');
    await page.locator('#postalCode').blur();
    await page.waitForTimeout(100);
    equal(await page.locator('#place').inputValue(), '', 'Place after failed request');
    equal(await page.locator('#region').inputValue(), '', 'Region after failed request');
    if (!logs.length) throw new Error('A rejected request did not write an error to the console.');
    return 'A rejected Fetch request left both outputs empty and was handled through the required console error path.';
  }
};
