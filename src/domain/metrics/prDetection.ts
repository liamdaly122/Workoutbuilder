import { estimate1RM, type OneRepMaxFormula } from './oneRepMax';

export interface HistoricSet {
  weight: number;
  reps: number;
}

export interface PRResult {
  isE1RMPR: boolean;
  isRepPR: boolean;
}

/**
 * Compares a newly logged set against all prior sets for the same exercise to detect
 * an estimated-1RM PR and/or a rep PR at that exact rep count. `history` must exclude
 * the new set itself.
 */
export function detectPR(
  newSet: HistoricSet,
  history: HistoricSet[],
  formula: OneRepMaxFormula = 'epley',
): PRResult {
  if (newSet.weight <= 0 || newSet.reps <= 0) return { isE1RMPR: false, isRepPR: false };

  const newE1RM = estimate1RM(newSet.weight, newSet.reps, formula);
  const bestE1RM = history.reduce((max, s) => Math.max(max, estimate1RM(s.weight, s.reps, formula)), 0);

  const bestAtSameReps = history
    .filter((s) => s.reps === newSet.reps)
    .reduce((max, s) => Math.max(max, s.weight), 0);

  return {
    isE1RMPR: newE1RM > bestE1RM,
    isRepPR: newSet.weight > bestAtSameReps,
  };
}
