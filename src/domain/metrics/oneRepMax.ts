export type OneRepMaxFormula = 'epley' | 'brzycki';

export function epley1RM(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

export function brzycki1RM(weight: number, reps: number): number {
  return reps <= 1 ? weight : (weight * 36) / (37 - reps);
}

export function estimate1RM(weight: number, reps: number, formula: OneRepMaxFormula = 'epley'): number {
  if (weight <= 0 || reps <= 0) return 0;
  return formula === 'epley' ? epley1RM(weight, reps) : brzycki1RM(weight, reps);
}
