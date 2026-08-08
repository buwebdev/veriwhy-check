/**
 * @file Shared assertion and normalization helpers for browser checks.
 * @author Richard Krasso
 *
 * Browser checks compare observable DOM values rather than a student's source
 * organization. Centralizing comparison, whitespace normalization, and browser
 * error handling keeps every course check consistent and produces concise,
 * actionable evidence when an interaction does not meet its public contract.
 */

import { isDeepStrictEqual } from 'node:util';

export function equal(actual, expected, label) {
  // Deep equality supports arrays and objects collected from a rendered page;
  // strict reference equality would reject structurally correct observations.
  if (!isDeepStrictEqual(actual, expected))
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`
    );
}

export function truthy(value, label) {
  // The label names the published requirement so failures never collapse into
  // an unhelpful generic assertion message.
  if (!value) throw new Error(`${label}: expected the requirement to be present.`);
}

export function normalized(value) {
  // HTML rendering can introduce harmless whitespace differences. Normalizing
  // whitespace tests visible meaning without enforcing source formatting.
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function text(page, selector) {
  // Keep selector lookup and normalization together so individual checks cannot
  // accidentally compare raw browser whitespace using different rules.
  return normalized(await page.locator(selector).textContent());
}

export function noBrowserErrors(state) {
  // Runtime and console errors are observable functional failures even when the
  // required markup happens to remain visible after the exception.
  if (state.pageErrors.length)
    throw new Error(`The page produced a runtime error: ${state.pageErrors[0]}`);
  if (state.consoleErrors.length)
    throw new Error(`The page produced a console error: ${state.consoleErrors[0]}`);
}

export function currency(value) {
  // Currency formatting is shared by checks that need a stable two-decimal
  // expectation independent of the host computer's locale.
  return `$${value.toFixed(2)}`;
}
