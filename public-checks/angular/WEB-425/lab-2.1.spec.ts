/**
 * @file WEB 425 Lab 2.1 Angular component behavior checks.
 * @author Richard Krasso
 *
 * The test renders the disclosed component through Angular rather than merely
 * searching its source. This validates template integration while allowing any
 * internal organization that produces the required student-visible regions.
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClassesComponent } from './classes/classes.component';
import { routes } from './app.routes';

// This public suite is injected only into the disposable copy and is excluded
// from counts of student-authored tests.
describe('VeriWhy Check public Lab 2.1 behavior', () => {
  it('provides the disclosed route variants', () => {
    expect(routes.some((route) => route.path === 'classes')).toBeTrue();
    expect(routes.some((route) => route.path === 'classes/:id')).toBeTrue();
    expect(routes.some((route) => route.path === 'about' && route.data?.['title'])).toBeTrue();
  });

  it('renders at least three routed character classes', async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    const fixture = TestBed.createComponent(ClassesComponent);
    fixture.detectChanges();
    const list = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="class-list"]');
    expect(list).not.toBeNull();
    expect(list?.querySelectorAll('a').length).toBeGreaterThanOrEqual(3);
  });
});
