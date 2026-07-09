import type { MovementPattern } from '../../domain/types';

/**
 * free-exercise-db has no movement-pattern field, so exercises are bucketed
 * by keyword-matching their name. Order matters: first match wins, so
 * narrower/special-case rules must precede the broader push/pull catch-alls.
 */
const RULES: Array<{ test: RegExp; pattern: MovementPattern }> = [
  { test: /leg press/i, pattern: 'squat' },
  { test: /leg extension/i, pattern: 'squat' },
  { test: /leg curl/i, pattern: 'hinge' },
  { test: /calf raise/i, pattern: 'other' },
  { test: /squat/i, pattern: 'squat' },
  {
    test: /deadlift|romanian|\brdl\b|good morning|hip thrust|glute bridge|hyperextension|back extension/i,
    pattern: 'hinge',
  },
  { test: /lunge|split squat|step[- ]?up|bulgarian/i, pattern: 'lunge' },
  { test: /farmer|carry|suitcase/i, pattern: 'carry' },
  {
    test: /plank|crunch|sit[- ]?up|russian twist|leg raise|ab wheel|ab roller|hollow|dead ?bug|woodchop|v-up/i,
    pattern: 'core',
  },
  {
    test: /row|pull[- ]?up|pulldown|chin[- ]?up|face pull|shrug|curl/i,
    pattern: 'pull',
  },
  {
    test: /bench|press|push[- ]?up|dip|fly|flye|overhead|shoulder press|incline|decline|raise|extension/i,
    pattern: 'push',
  },
];

export function inferMovementPattern(exerciseName: string): MovementPattern {
  for (const rule of RULES) {
    if (rule.test.test(exerciseName)) return rule.pattern;
  }
  return 'other';
}

/** Name patterns that need a bar (pull-up bar), overriding the source's "body only" equipment tag. */
export const PULL_UP_BAR_NAME_TEST = /pull-?up|chin-?up/i;
