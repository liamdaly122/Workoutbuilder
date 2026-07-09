import { describe, expect, it } from 'vitest';
import { detectPR } from './prDetection';

describe('detectPR', () => {
  it('flags an e1RM PR when the new set beats every prior estimated 1RM', () => {
    const result = detectPR({ weight: 110, reps: 5 }, [{ weight: 100, reps: 5 }]);
    expect(result.isE1RMPR).toBe(true);
  });

  it('flags a rep PR when the new set is heavier at the same rep count', () => {
    const result = detectPR(
      { weight: 105, reps: 8 },
      [
        { weight: 100, reps: 8 },
        { weight: 120, reps: 3 },
      ],
    );
    expect(result.isRepPR).toBe(true);
  });

  it('does not flag a PR when performance is equal or worse', () => {
    const result = detectPR({ weight: 90, reps: 5 }, [{ weight: 100, reps: 5 }]);
    expect(result.isE1RMPR).toBe(false);
    expect(result.isRepPR).toBe(false);
  });

  it('treats an empty history as an automatic PR', () => {
    const result = detectPR({ weight: 60, reps: 10 }, []);
    expect(result.isE1RMPR).toBe(true);
    expect(result.isRepPR).toBe(true);
  });

  it('ignores zero/invalid sets', () => {
    const result = detectPR({ weight: 0, reps: 10 }, []);
    expect(result.isE1RMPR).toBe(false);
    expect(result.isRepPR).toBe(false);
  });
});
