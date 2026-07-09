import type { BodyRegion, ProgressionRuleSet } from '../types';

export function roundToIncrement(value: number, increment: number): number {
  if (increment <= 0) return value;
  return Math.round(value / increment) * increment;
}

export interface CompletedMainLiftSet {
  exerciseId: string;
  bodyRegion: BodyRegion;
  targetReps: [number, number];
  targetWeight: number;
  actualReps: number | null;
  actualWeight: number | null;
}

export interface NextCycleSuggestion {
  exerciseId: string;
  previousWeight: number;
  suggestedWeight: number;
  hitRate: number;
  rationale: 'progressed' | 'repeated' | 'regressed';
}

/**
 * From a completed mesocycle's peak (week 4) main-lift sets, suggests each lift's
 * starting weight for the next cycle. Pure and side-effect free - callers decide
 * whether/how to let the user edit the suggestion before a new mesocycle is generated.
 */
export function computeNextCycleBaseline(
  week4SetsByExercise: Map<string, CompletedMainLiftSet[]>,
  ruleSet: ProgressionRuleSet,
): NextCycleSuggestion[] {
  const suggestions: NextCycleSuggestion[] = [];

  for (const [exerciseId, sets] of week4SetsByExercise) {
    if (sets.length === 0) continue;
    const bodyRegion = sets[0].bodyRegion;
    const previousWeight = sets[0].targetWeight;

    const hits = sets.filter(
      (s) =>
        s.actualReps !== null &&
        s.actualWeight !== null &&
        s.actualReps >= s.targetReps[0] &&
        s.actualWeight >= s.targetWeight,
    ).length;
    const hitRate = hits / sets.length;

    const increment: number =
      bodyRegion === 'upper' ? ruleSet.upperBodyIncrementKg : ruleSet.lowerBodyIncrementKg;

    let suggestedWeight: number;
    let rationale: NextCycleSuggestion['rationale'];
    if (hitRate >= ruleSet.successThresholdPct) {
      suggestedWeight = roundToIncrement(previousWeight + increment, ruleSet.roundingIncrementKg);
      rationale = 'progressed';
    } else if (hitRate >= 0.5) {
      suggestedWeight = previousWeight;
      rationale = 'repeated';
    } else {
      suggestedWeight = roundToIncrement(previousWeight * 0.95, ruleSet.roundingIncrementKg);
      rationale = 'regressed';
    }

    suggestions.push({ exerciseId, previousWeight, suggestedWeight, hitRate, rationale });
  }

  return suggestions;
}
