/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CharacterProfileComponent } from './character-profile/character-profile.component';

describe('VeriWhy Check public Lab 6.1 dynamic form', () => {
  it('renders the disclosed dynamic controls from option data', async () => {
    await TestBed.configureTestingModule({ imports: [CharacterProfileComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CharacterProfileComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    for (const id of ['profile-form', 'backstory', 'alignment-group', 'skill-options', 'homeland', 'profile-submit', 'profile-list']) {
      expect(root.querySelector(`[data-testid="${id}"]`)).withContext(id).not.toBeNull();
    }
    expect(root.querySelector('[data-testid="skill-options"]')?.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThanOrEqual(3);
  });
});
