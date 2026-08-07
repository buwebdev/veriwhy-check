/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

async function row(page, index) {
  return await page.locator('tbody tr').nth(index).locator('td').allInnerTexts().then((cells) => cells.map(normalized));
}

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    equal(await page.locator('tbody tr').count(), 4, 'Service-plan row count');
    return 'The page loaded without browser errors and displayed four service rows.';
  },
  async 'basic-plan'(page) {
    equal(await row(page, 0), ['Basic', '0 Mbps'], 'Basic service row');
    return 'The Basic service displays the required name and 0 Mbps speed.';
  },
  async 'express-plan'(page) {
    equal(await row(page, 1), ['Express', '100 Mbps'], 'Express service row');
    return 'The Express service displays the required name and speed.';
  },
  async 'extreme-plan'(page) {
    equal(await row(page, 2), ['Extreme', '500 Mbps'], 'Extreme service row');
    return 'The Extreme service displays the required name and speed.';
  },
  async 'ultimate-plan'(page) {
    equal(await row(page, 3), ['Ultimate', '1 Gig'], 'Ultimate service row');
    return 'The Ultimate service displays the required name and speed.';
  }
};
