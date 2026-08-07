/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors } from '../helpers.mjs';

export const cases = {
  async 'puzzle-loads'(page, state) {
    noBrowserErrors(state);
    equal(await page.locator('#puzzleBoard img').count(), 48, 'Puzzle-piece count');
    return 'The page loaded without browser errors and generated all 48 puzzle pieces.';
  },
  async 'piece-set'(page) {
    const sources = await page.locator('#puzzleBoard img').evaluateAll((images) => images.map((image) => image.getAttribute('src')).sort());
    equal(new Set(sources).size, 48, 'Unique puzzle-piece sources');
    equal(sources.every((source) => /^piece(?:[1-9]|[1-3][0-9]|4[0-8])\.png$/.test(source ?? '')), true, 'Puzzle-piece filenames');
    return 'The generated board contained one instance of each image from piece1.png through piece48.png.';
  },
  async 'pointer-drag'(page) {
    const piece = page.locator('#puzzleBoard img').first();
    const before = await piece.evaluate((element) => ({ left: element.style.left, top: element.style.top }));
    const box = await piece.boundingBox();
    if (!box) throw new Error('The first puzzle piece did not have a rendered position.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2 + 25, { steps: 4 });
    await page.mouse.up();
    const after = await piece.evaluate((element) => ({ left: element.style.left, top: element.style.top, zIndex: element.style.zIndex, touchAction: element.style.touchAction }));
    if (after.left === before.left || after.top === before.top) throw new Error('Pointer movement did not change the puzzle piece position.');
    if (Number(after.zIndex) <= 1) throw new Error('Dragging did not raise the puzzle piece z-index.');
    equal(after.touchAction, 'none', 'Dragged-piece touch action');
    return 'Pointer input selected, raised, moved, and released a puzzle piece using its rendered coordinates.';
  }
};
