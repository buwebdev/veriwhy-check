/**
 * @file Public functional check used by VeriWhy Check.
 * @author Richard Krasso
 */

import { TestBed } from '@angular/core/testing';
import { DiceService } from './dice.service';

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
