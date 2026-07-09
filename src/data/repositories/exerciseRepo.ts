import { db } from '../db';
import { generateId } from '../../lib/id';
import type { Exercise, EquipmentTag, MovementPattern } from '../../domain/types';

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: string;
  equipment?: EquipmentTag;
  movementPattern?: MovementPattern;
  includeHidden?: boolean;
}

export async function listExercises(filters: ExerciseFilters = {}): Promise<Exercise[]> {
  let results = await db.exercises.toArray();

  if (!filters.includeHidden) results = results.filter((e) => !e.isHidden);
  if (filters.muscleGroup) results = results.filter((e) => e.muscleGroup === filters.muscleGroup);
  if (filters.equipment) results = results.filter((e) => e.equipment === filters.equipment);
  if (filters.movementPattern)
    results = results.filter((e) => e.movementPattern === filters.movementPattern);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(q));
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function getExercisesByIds(ids: string[]): Promise<Map<string, Exercise>> {
  const found = await db.exercises.bulkGet(ids);
  const map = new Map<string, Exercise>();
  found.forEach((ex, i) => {
    if (ex) map.set(ids[i], ex);
  });
  return map;
}

/** Alternative exercises for swapping into a session slot: same movement pattern, equipment on hand. */
export async function listSwapCandidates(
  movementPattern: MovementPattern,
  availableTags: ReadonlySet<EquipmentTag>,
  excludeExerciseId: string,
): Promise<Exercise[]> {
  const all = await db.exercises.where('movementPattern').equals(movementPattern).toArray();
  return all
    .filter((e) => !e.isHidden && e.id !== excludeExerciseId && availableTags.has(e.equipment))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  await db.exercises.update(id, { isFavorite, updatedAt: new Date().toISOString() });
}

export async function toggleHidden(id: string, isHidden: boolean): Promise<void> {
  await db.exercises.update(id, { isHidden, updatedAt: new Date().toISOString() });
}

export interface NewCustomExercise {
  name: string;
  equipment: EquipmentTag;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  muscleGroup: string;
  mechanic?: 'compound' | 'isolation' | null;
  instructions?: string[];
}

export async function addCustomExercise(input: NewCustomExercise): Promise<Exercise> {
  const now = new Date().toISOString();
  const exercise: Exercise = {
    id: generateId('custom'),
    name: input.name,
    force: null,
    level: 'intermediate',
    mechanic: input.mechanic ?? null,
    equipment: input.equipment,
    primaryMuscles: input.primaryMuscles,
    secondaryMuscles: input.secondaryMuscles ?? [],
    muscleGroup: input.muscleGroup,
    instructions: input.instructions ?? [],
    category: 'strength',
    movementPattern: input.movementPattern,
    source: 'custom',
    isHidden: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.exercises.add(exercise);
  return exercise;
}
