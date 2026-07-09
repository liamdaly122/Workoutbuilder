import { describe, expect, it } from 'vitest';
import { computeNextCycleBaseline, roundToIncrement, type CompletedMainLiftSet } from './progression';
import { DEFAULT_PROGRESSION_RULES } from '../types';

describe('roundToIncrement', () => {
  it('rounds to the nearest plate-loadable increment', () => {
    expect(roundToIncrement(101, 2.5)).toBe(100);
    expect(roundToIncrement(103, 2.5)).toBe(102.5);
    expect(roundToIncrement(51, 5)).toBe(50);
  });

  it('returns the value unchanged for a non-positive increment', () => {
    expect(roundToIncrement(101, 0)).toBe(101);
  });
});

function makeSets(count: number, targetWeight: number, actual: { weight: number; reps: number }): CompletedMainLiftSet[] {
  return Array.from({ length: count }, () => ({
    exerciseId: 'bench',
    bodyRegion: 'upper' as const,
    targetReps: [6, 8] as [number, number],
    targetWeight,
    actualReps: actual.reps,
    actualWeight: actual.weight,
  }));
}

describe('computeNextCycleBaseline', () => {
  it('progresses the weight when the success threshold is met', () => {
    const sets = makeSets(3, 60, { weight: 60, reps: 8 });
    const [suggestion] = computeNextCycleBaseline(new Map([['bench', sets]]), DEFAULT_PROGRESSION_RULES);
    expect(suggestion.rationale).toBe('progressed');
    expect(suggestion.suggestedWeight).toBeGreaterThan(60);
  });

  it('repeats the same weight for a partial hit rate (>=50% but below the success threshold)', () => {
    const sets = [
      ...makeSets(2, 60, { weight: 60, reps: 8 }),
      ...makeSets(1, 60, { weight: 55, reps: 5 }),
    ];
    const [suggestion] = computeNextCycleBaseline(new Map([['bench', sets]]), DEFAULT_PROGRESSION_RULES);
    expect(suggestion.rationale).toBe('repeated');
    expect(suggestion.suggestedWeight).toBe(60);
  });

  it('regresses the weight when most sets miss target', () => {
    const sets = makeSets(3, 60, { weight: 50, reps: 4 });
    const [suggestion] = computeNextCycleBaseline(new Map([['bench', sets]]), DEFAULT_PROGRESSION_RULES);
    expect(suggestion.rationale).toBe('regressed');
    expect(suggestion.suggestedWeight).toBeLessThan(60);
  });

  it('uses the lower-body increment for lower-body lifts', () => {
    const sets: CompletedMainLiftSet[] = makeSets(3, 100, { weight: 100, reps: 8 }).map((s) => ({
      ...s,
      bodyRegion: 'lower',
    }));
    const [suggestion] = computeNextCycleBaseline(new Map([['squat', sets]]), DEFAULT_PROGRESSION_RULES);
    expect(suggestion.suggestedWeight).toBe(
      roundToIncrement(100 + DEFAULT_PROGRESSION_RULES.lowerBodyIncrementKg, DEFAULT_PROGRESSION_RULES.roundingIncrementKg),
    );
  });
});
