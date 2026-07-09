import { describe, expect, it } from 'vitest';
import { brzycki1RM, epley1RM, estimate1RM } from './oneRepMax';

describe('oneRepMax', () => {
  it('returns the weight itself for a 1-rep set', () => {
    expect(epley1RM(100, 1)).toBe(100);
    expect(brzycki1RM(100, 1)).toBe(100);
  });

  it('epley matches the known formula', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it('brzycki matches the known formula', () => {
    expect(brzycki1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it('estimate1RM dispatches to the selected formula', () => {
    expect(estimate1RM(100, 5, 'epley')).toBe(epley1RM(100, 5));
    expect(estimate1RM(100, 5, 'brzycki')).toBe(brzycki1RM(100, 5));
  });

  it('treats zero weight or reps as zero', () => {
    expect(estimate1RM(0, 10)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
  });
});
