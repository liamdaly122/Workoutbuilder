import type { Exercise, ExerciseSlot, EquipmentTag } from '../types';

/** Equipment that carries no meaningful external load, so main-lift %1RM targeting doesn't apply. */
export const NON_LOADABLE_EQUIPMENT: EquipmentTag[] = ['bodyweight', 'pull_up_bar', 'resistance_band'];

export function isLoadable(exercise: Exercise): boolean {
  return !NON_LOADABLE_EQUIPMENT.includes(exercise.equipment);
}

export function isEquipmentAvailable(
  tag: EquipmentTag,
  availableTags: ReadonlySet<EquipmentTag>,
): boolean {
  return availableTags.has(tag);
}

/** Exercises usable for auto-generated plans: not hidden, has a recognized movement pattern, equipment on hand. */
export function candidatesForSlot(
  slot: ExerciseSlot,
  exercises: Exercise[],
  availableTags: ReadonlySet<EquipmentTag>,
): Exercise[] {
  const pool = exercises.filter(
    (e) =>
      !e.isHidden &&
      e.movementPattern === slot.movementPattern &&
      e.category === 'strength' &&
      availableTags.has(e.equipment),
  );

  if (slot.preferredEquipment && slot.preferredEquipment.length > 0) {
    const preferred = pool.filter((e) => slot.preferredEquipment!.includes(e.equipment));
    if (preferred.length > 0) return sortDeterministic(preferred);
  }
  return sortDeterministic(pool);
}

function sortDeterministic(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Picks one exercise for a slot, preferring compound movements for main lifts and
 * avoiding exercises already assigned to another slot in the same mesocycle (for variety),
 * falling back to allowing repeats if the pattern's candidate pool is small.
 */
export function pickExercise(
  slot: ExerciseSlot,
  exercises: Exercise[],
  availableTags: ReadonlySet<EquipmentTag>,
  alreadyAssignedIds: ReadonlySet<string>,
): Exercise | null {
  const candidates = candidatesForSlot(slot, exercises, availableTags);
  if (candidates.length === 0) return null;

  const rank = (e: Exercise) => {
    let score = 0;
    if (slot.role === 'main' && e.mechanic === 'compound') score += 2;
    if (!alreadyAssignedIds.has(e.id)) score += 1;
    return score;
  };

  return candidates.reduce((best, e) => (rank(e) > rank(best) ? e : best), candidates[0]);
}
