/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
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
