/**
 * @file WEB 425 Lab 1.1 Angular component behavior checks.
 * @author Richard Krasso
 *
 * The test compiles the student's standalone Angular component and inspects its
 * disclosed rendered contract. It deliberately avoids unit-test quantity and
 * source-style requirements because those concepts are not taught in Lab 1.1.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { routes } from './app.routes';

// The suite name identifies this injected file as public checker evidence rather
// than a student-authored unit test.
describe('VeriWhy Check public Lab 1.1 behavior', () => {
  it('maps the default route to HomeComponent', () => {
    expect(routes.find((route) => route.path === '')?.component).toBe(HomeComponent);
  });

  it('renders the disclosed semantic and stable-selector contract', async () => {
    // TestBed validates imports, compilation, providers, and DOM rendering
    // together; source-only matching could miss those integration failures.
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    // Published test ids observe structure without requiring optional CSS names.
    expect(root.querySelector('[data-testid="home-page"]')).not.toBeNull();
    expect(
      root.querySelector('[data-testid="character-features"]')?.querySelectorAll('li').length
    ).toBeGreaterThanOrEqual(3);
  });
});
