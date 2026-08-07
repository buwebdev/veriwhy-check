/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { routes } from './app.routes';

describe('VeriWhy Check public Lab 1.1 behavior', () => {
  it('maps the default route to HomeComponent', () => {
    expect(routes.find((route) => route.path === '')?.component).toBe(HomeComponent);
  });

  it('renders the disclosed semantic and stable-selector contract', async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="home-page"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="character-features"]')?.querySelectorAll('li').length).toBeGreaterThanOrEqual(3);
  });
});
