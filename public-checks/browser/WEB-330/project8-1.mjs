/**
 * @file WEB 330 Assignment 1.3 browser behavior checks.
 * @author Richard Krasso
 *
 * These public cases exercise the rendered application as a user would. They
 * validate required outputs across more than one input while allowing any
 * internal object model or source organization that satisfies the assignment.
 */

import { equal, noBrowserErrors } from '../helpers.mjs';

async function setTimer(page, minutes, seconds) {
  await page.locator('#minutesBox').fill(String(minutes));
  await page.locator('#minutesBox').dispatchEvent('change');
  await page.locator('#secondsBox').fill(String(seconds));
  await page.locator('#secondsBox').dispatchEvent('change');
}

async function values(page) {
  return {
    minutes: await page.locator('#minutesBox').inputValue(),
    seconds: await page.locator('#secondsBox').inputValue()
  };
}

// Stable case identifiers are referenced by the public profile and should change
// only when the published assessment contract receives a new version.
export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of ['#minutesBox', '#secondsBox', '#runPauseButton']) {
      equal(await page.locator(selector).count(), 1, `${selector} control count`);
    }
    return 'The timer loaded without browser errors and exposed all required controls.';
  },
  async 'run-and-pause'(page) {
    await setTimer(page, 0, 3);
    await page.locator('#runPauseButton').click();
    await page.waitForTimeout(1150);
    equal(await values(page), { minutes: '0', seconds: '2' }, 'Timer after one interval');
    await page.locator('#runPauseButton').click();
    await page.waitForTimeout(1100);
    equal(await values(page), { minutes: '0', seconds: '2' }, 'Paused timer values');
    return 'The Run/Pause button started the one-second countdown and then paused it without losing state.';
  },
  async 'rollover-and-stop'(page) {
    await setTimer(page, 1, 0);
    await page.locator('#runPauseButton').click();
    await page.waitForTimeout(1150);
    equal(await values(page), { minutes: '0', seconds: '59' }, 'Minute rollover');
    await page.locator('#runPauseButton').click();
    await setTimer(page, 0, 1);
    await page.locator('#runPauseButton').click();
    await page.waitForTimeout(2150);
    equal(await values(page), { minutes: '0', seconds: '0' }, 'Timer at completion');
    return 'The timer rolled one minute into 59 seconds and stopped after reaching zero.';
  }
};
