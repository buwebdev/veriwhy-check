/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { equal, noBrowserErrors, normalized } from '../helpers.mjs';

async function generate(page, name, gender, characterClass) {
  await page.locator('#heroName').fill(name);
  await page.locator('#heroGender').selectOption(gender);
  await page.locator('#heroClass').selectOption(characterClass);
  await page.locator('#generateHero').click();
  return normalized(await page.locator('#characterOutput').innerText());
}

export const cases = {
  async 'page-loads'(page, state) {
    noBrowserErrors(state);
    for (const selector of ['#heroName', '#heroGender', '#heroClass', '#generateHero', '#characterOutput']) {
      equal(await page.locator(selector).count(), 1, `${selector} element count`);
    }
    return 'The character form loaded without browser errors and exposed every required input and output.';
  },
  async 'closure-contract'(page) {
    const result = await page.evaluate(() => {
      const character = createCharacter('Ada', 'female', 'mage');
      character.name = 'Changed';
      return {
        name: character.getName(),
        gender: character.getGender(),
        characterClass: character.getClass(),
        keys: Object.keys(character).sort()
      };
    });
    equal(result, {
      name: 'Ada', gender: 'female', characterClass: 'mage', keys: ['getClass', 'getGender', 'getName', 'name']
    }, 'Closure result');
    return 'The factory preserved constructor values through getter closures instead of exposing those values as writable object properties.';
  },
  async 'form-results'(page) {
    equal(await generate(page, 'Aria', 'female', 'rogue'), 'Name: Aria Gender: female Class: rogue', 'First character output');
    equal(await generate(page, 'Borin', 'other', 'warrior'), 'Name: Borin Gender: other Class: warrior', 'Second character output');
    return 'Submitting different form values displayed the corresponding character name, gender, and class.';
  }
};
