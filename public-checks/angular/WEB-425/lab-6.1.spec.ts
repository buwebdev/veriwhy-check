/**
 * @file WEB 425 Lab 6.1 Angular dynamic-form behavior checks.
 * @author Richard Krasso
 *
 * The test compiles the completed dynamic profile form and inspects its public
 * regions and option-driven controls. Assertions focus on the rendered contract
 * and allow equivalent component decomposition and styling decisions.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CharacterProfileComponent } from './character-profile/character-profile.component';

// The final lab suite inspects the integrated dynamic form without requiring the
// same private arrays, helpers, or component breakdown as the solution.
describe('VeriWhy Check public Lab 6.1 dynamic form', () => {
  it('renders the disclosed dynamic controls from option data', async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterProfileComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    const fixture = TestBed.createComponent(CharacterProfileComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    // Disclosed test ids observe each region without turning optional CSS class
    // names into hidden grading criteria.
    for (const id of [
      'profile-form',
      'backstory',
      'alignment-group',
      'skill-options',
      'homeland',
      'profile-submit',
      'profile-list'
    ]) {
      expect(root.querySelector(`[data-testid="${id}"]`))
        .withContext(id)
        .not.toBeNull();
    }
    // Several generated options distinguish a dynamic form from an empty shell
    // containing only the expected surrounding identifier.
    expect(
      root
        .querySelector('[data-testid="skill-options"]')
        ?.querySelectorAll('input[type="checkbox"]').length
    ).toBeGreaterThanOrEqual(3);
  });
});
