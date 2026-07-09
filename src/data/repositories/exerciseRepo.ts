import { supabase } from '../supabaseClient';
import { generateId } from '../../lib/id';
import type { Exercise, EquipmentTag, MovementPattern } from '../../domain/types';

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: string;
  equipment?: EquipmentTag;
  movementPattern?: MovementPattern;
  includeHidden?: boolean;
}

interface ExerciseRow {
  id: string;
  name: string;
  force: Exercise['force'];
  level: Exercise['level'];
  mechanic: Exercise['mechanic'];
  equipment: EquipmentTag;
  primary_muscles: string[];
  secondary_muscles: string[];
  muscle_group: string;
  instructions: string[];
  category: string;
  movement_pattern: MovementPattern;
  source: Exercise['source'];
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  exercise_preferences: Array<{ is_favorite: boolean; is_hidden: boolean }> | null;
}

const EXERCISE_SELECT = '*, exercise_preferences(is_favorite, is_hidden)';

function toDomainExercise(row: ExerciseRow): Exercise {
  const pref = row.exercise_preferences?.[0];
  return {
    id: row.id,
    name: row.name,
    force: row.force,
    level: row.level,
    mechanic: row.mechanic,
    equipment: row.equipment,
    primaryMuscles: row.primary_muscles,
    secondaryMuscles: row.secondary_muscles,
    muscleGroup: row.muscle_group,
    instructions: row.instructions,
    category: row.category,
    movementPattern: row.movement_pattern,
    source: row.source,
    isFavorite: pref?.is_favorite ?? false,
    isHidden: pref?.is_hidden ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listExercises(filters: ExerciseFilters = {}): Promise<Exercise[]> {
  const { data, error } = await supabase.from('exercises').select(EXERCISE_SELECT);
  if (error) throw error;

  // Filtering happens client-side (same as the old approach): under a thousand
  // rows is trivial to filter in JS, and it sidesteps PostgREST's filter-on-
  // embedded-resource quirks for the includeHidden/preference-based filter.
  let results = (data as ExerciseRow[]).map(toDomainExercise);
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
  const { data, error } = await supabase.from('exercises').select(EXERCISE_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toDomainExercise(data as ExerciseRow) : undefined;
}

export async function getExercisesByIds(ids: string[]): Promise<Map<string, Exercise>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from('exercises').select(EXERCISE_SELECT).in('id', ids);
  if (error) throw error;
  const map = new Map<string, Exercise>();
  for (const row of data as ExerciseRow[]) map.set(row.id, toDomainExercise(row));
  return map;
}

/** Alternative exercises for swapping into a session slot: same movement pattern, equipment on hand. */
export async function listSwapCandidates(
  movementPattern: MovementPattern,
  availableTags: ReadonlySet<EquipmentTag>,
  excludeExerciseId: string,
): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select(EXERCISE_SELECT)
    .eq('movement_pattern', movementPattern);
  if (error) throw error;

  return (data as ExerciseRow[])
    .map(toDomainExercise)
    .filter((e) => !e.isHidden && e.id !== excludeExerciseId && availableTags.has(e.equipment))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('exercise_preferences')
    .upsert(
      { user_id: userId, exercise_id: id, is_favorite: isFavorite, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' },
    );
  if (error) throw error;
}

export async function toggleHidden(id: string, isHidden: boolean): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('exercise_preferences')
    .upsert(
      { user_id: userId, exercise_id: id, is_hidden: isHidden, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' },
    );
  if (error) throw error;
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
  const userId = await currentUserId();
  const now = new Date().toISOString();
  const row = {
    id: generateId('custom'),
    name: input.name,
    force: null,
    level: 'intermediate',
    mechanic: input.mechanic ?? null,
    equipment: input.equipment,
    primary_muscles: input.primaryMuscles,
    secondary_muscles: input.secondaryMuscles ?? [],
    muscle_group: input.muscleGroup,
    instructions: input.instructions ?? [],
    category: 'strength',
    movement_pattern: input.movementPattern,
    source: 'custom',
    owner_id: userId,
    created_at: now,
    updated_at: now,
  };
  const { data, error } = await supabase.from('exercises').insert(row).select(EXERCISE_SELECT).single();
  if (error) throw error;
  return toDomainExercise(data as ExerciseRow);
}
