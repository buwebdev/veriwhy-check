/**
 * @file WEB 231 Assignment 1.3 browser behavior checks.
 * @author Richard Krasso
 *
 * The cases load the published page and inspect visible behavior through a real
 * browser. They intentionally avoid grading indentation, naming, comments, or a
 * particular internal solution so evaluation follows the disclosed functional
 * outcome rather than the reference implementation.
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

async function row(page, index) {
  return await page
    .locator('tbody tr')
    .nth(index)
    .locator('td')
    .allInnerTexts()
    .then((cells) => cells.map(normalized));
}

// Case names match the YAML profile, making the connection between a published
// requirement and its executable evidence explicit and reviewable.
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
