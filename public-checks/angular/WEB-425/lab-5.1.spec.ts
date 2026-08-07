/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { SigninComponent } from './signin/signin.component';

describe('VeriWhy Check public Lab 5.1 behavior', () => {
  it('supports the complete authentication state cycle', () => {
    const service = TestBed.inject(AuthService);
    service.signout();
    expect(service.isAuthenticated()).toBeFalse();
    service.signin('student');
    expect(service.isAuthenticated()).toBeTrue();
    service.signout();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('renders the disclosed reactive sign-in controls', async () => {
    await TestBed.configureTestingModule({ imports: [SigninComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(SigninComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    for (const id of ['signin-form', 'username', 'access-code', 'signin-submit']) {
      expect(root.querySelector(`[data-testid="${id}"]`)).withContext(id).not.toBeNull();
    }
  });
});
