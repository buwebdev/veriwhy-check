/**
 * @file WEB 425 Lab 3.1 Angular testing behavior checks.
 * @author Richard Krasso
 *
 * Lab 3.1 is the first point where student-authored unit testing is part of the
 * course sequence. The public test verifies observable component behavior while
 * the profile separately checks the disclosed testing evidence.
 */

import { TestBed } from '@angular/core/testing';
import { DiceService } from './dice.service';

// Lab 3.1 begins testing evidence; this public suite remains separate from, and
// never counts as, the student's own required unit tests.
describe('VeriWhy Check public Lab 3.1 boundaries', () => {
  let service: DiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiceService);
  });

  it('returns integers inside several disclosed boundaries', () => {
    for (const sides of [2, 6, 20]) {
      for (let sample = 0; sample < 40; sample += 1) {
        const value = service.roll(sides);
        expect(Number.isInteger(value)).toBeTrue();
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(sides);
      }
    }
  });

  it('rejects invalid side counts', () => {
    for (const sides of [1, 0, -2, 2.5, Number.NaN]) {
      expect(() => service.roll(sides)).toThrowError(RangeError);
    }
  });
});
