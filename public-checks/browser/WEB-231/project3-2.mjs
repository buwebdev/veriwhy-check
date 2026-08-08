/**
 * @file WEB 231 Assignment 5.2 browser behavior checks.
 * @author Richard Krasso
 *
 * The cases evaluate rendered controls, real user events, and resulting text.
 * They remain indifferent to code layout, comment quantity, identifier
 * preferences, and internal decomposition.
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

const captions = [
  'International Space Station fourth expansion [2009]',
  'Assembling the International Space Station [1998]',
  'The Atlantis docks with the ISS [2001]',
  'The Atlantis approaches the ISS [2000]',
  'The Atlantis approaches the ISS [2000]',
  'International Space Station over Earth [2002]',
  'The International Space Station first expansion [2002]',
  'Hurricane Ivan from the ISS [2008]',
  'The Soyuz spacecraft approaches the ISS [2005]',
  'The International Space Station from above [2006]',
  'Maneuvering in space with the Canadarm2 [2006]',
  'The International Space Station second expansion [2006]',
  'The International Space Station third expansion [2007]',
  'The ISS over the Ionian Sea [2007]'
];

// Every case returns positive evidence on success; thrown labeled assertions are
// converted by the runner into the corresponding needs-attention feedback.
export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    equal(await page.locator('#gallery').count(), 1, 'Gallery container count');
    return 'The gallery page loaded without browser errors.';
  },
  async 'figure-count'(page) {
    equal(await page.locator('#gallery figure').count(), 14, 'Generated figure count');
    return 'The gallery generated all 14 required figures.';
  },
  async 'image-sequence'(page) {
    const sources = await page
      .locator('#gallery figure img')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
    equal(
      sources,
      Array.from({ length: 14 }, (_value, index) => `slide${index}.jpg`),
      'Gallery image sequence'
    );
    return 'The generated image elements reference slide0.jpg through slide13.jpg in order.';
  },
  async 'caption-sequence'(page) {
    const actual = (await page.locator('#gallery figcaption').allTextContents()).map(normalized);
    equal(actual, captions, 'Gallery captions');
    return 'All 14 figures display the corresponding required captions.';
  },
  async 'complete-figures'(page) {
    const complete = await page
      .locator('#gallery figure')
      .evaluateAll(
        (figures) =>
          figures.length === 14 &&
          figures.every(
            (figure) =>
              figure.querySelectorAll(':scope > img').length === 1 &&
              figure.querySelectorAll(':scope > figcaption').length === 1
          )
      );
    equal(complete, true, 'Figure image-and-caption structure');
    return 'Every generated figure contains one image and one caption.';
  }
};
