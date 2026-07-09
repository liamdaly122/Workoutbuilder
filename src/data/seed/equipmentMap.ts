import type { EquipmentTag } from '../../domain/types';

/** Normalizes free-exercise-db's free-text `equipment` field to our fixed EquipmentTag union. */
const SOURCE_EQUIPMENT_MAP: Record<string, EquipmentTag> = {
  'body only': 'bodyweight',
  machine: 'machine',
  other: 'other',
  'foam roll': 'other',
  kettlebells: 'kettlebell',
  dumbbell: 'dumbbell',
  cable: 'cable_machine',
  barbell: 'barbell',
  bands: 'resistance_band',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'exercise_ball',
  'e-z curl bar': 'ez_bar',
};

export function normalizeEquipment(sourceEquipment: string | null): EquipmentTag {
  if (sourceEquipment === null) return 'bodyweight';
  return SOURCE_EQUIPMENT_MAP[sourceEquipment] ?? 'other';
}

export const EQUIPMENT_CATALOG: Array<{ id: EquipmentTag; label: string }> = [
  { id: 'bodyweight', label: 'Bodyweight only' },
  { id: 'barbell', label: 'Barbell & rack' },
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'kettlebell', label: 'Kettlebells' },
  { id: 'cable_machine', label: 'Cable machine' },
  { id: 'machine', label: 'Weight machines' },
  { id: 'resistance_band', label: 'Resistance bands' },
  { id: 'pull_up_bar', label: 'Pull-up bar' },
  { id: 'ez_bar', label: 'EZ curl bar' },
  { id: 'medicine_ball', label: 'Medicine ball' },
  { id: 'exercise_ball', label: 'Exercise / stability ball' },
];

/** Coarse muscle-group buckets for catalog filter UI. */
const MUSCLE_GROUP_MAP: Record<string, string> = {
  chest: 'chest',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  lats: 'back',
  'middle back': 'back',
  traps: 'back',
  'lower back': 'back',
  abdominals: 'core',
  quadriceps: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
  abductors: 'legs',
  neck: 'neck',
};

export function inferMuscleGroup(primaryMuscles: string[]): string {
  for (const muscle of primaryMuscles) {
    const group = MUSCLE_GROUP_MAP[muscle];
    if (group) return group;
  }
  return 'other';
}
