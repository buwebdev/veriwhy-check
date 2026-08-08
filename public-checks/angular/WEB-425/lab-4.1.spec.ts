/**
 * @file WEB 425 Lab 4.1 Angular form behavior checks.
 * @author Richard Krasso
 *
 * The public test compiles and renders the required form regions using Angular's
 * runtime. Selectors come from explicit lab instructions, while styling and
 * private component implementation remain outside assessment.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CharacterBuilderComponent } from './character-builder/character-builder.component';

// Angular renders the form before assertions so source that merely mentions a
// control cannot pass when bindings or imports prevent it from appearing.
describe('VeriWhy Check public Lab 4.1 form contract', () => {
  it('renders every disclosed form control and action', async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterBuilderComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    const fixture = TestBed.createComponent(CharacterBuilderComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    for (const id of [
      'character-form',
      'character-name',
      'character-class',
      'character-level',
      'character-veteran',
      'character-submit',
      'character-list'
    ]) {
      expect(root.querySelector(`[data-testid="${id}"]`))
        .withContext(id)
        .not.toBeNull();
    }
    const level = root.querySelector('[data-testid="character-level"]') as HTMLInputElement;
    expect(level.min).toBe('1');
    expect(level.max).toBe('20');
  });
});
