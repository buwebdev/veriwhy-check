/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { isDeepStrictEqual } from 'node:util';

export function equal(actual, expected, label) {
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
}

export function truthy(value, label) {
  if (!value) throw new Error(`${label}: expected the requirement to be present.`);
}

export function normalized(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export async function text(page, selector) {
  return normalized(await page.locator(selector).textContent());
}

export function noBrowserErrors(state) {
  if (state.pageErrors.length) throw new Error(`The page produced a runtime error: ${state.pageErrors[0]}`);
  if (state.consoleErrors.length) throw new Error(`The page produced a console error: ${state.consoleErrors[0]}`);
}

export function currency(value) {
  return `$${value.toFixed(2)}`;
}
