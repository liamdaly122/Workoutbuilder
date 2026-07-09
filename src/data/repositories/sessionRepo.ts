import { supabase } from '../supabaseClient';
import type { SessionExercise, WorkoutSession } from '../../domain/types';

interface SessionRow {
  id: string;
  mesocycle_id: string;
  week_number: WorkoutSession['weekNumber'];
  day_index: number;
  label: string;
  status: WorkoutSession['status'];
  started_at: string | null;
  completed_at: string | null;
}

function toDomainSession(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    mesocycleId: row.mesocycle_id,
    weekNumber: row.week_number,
    dayIndex: row.day_index,
    label: row.label,
    status: row.status,
    ...(row.started_at ? { startedAt: row.started_at } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  };
}

interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  slot_id: string;
  movement_pattern: SessionExercise['movementPattern'];
  order_index: number;
  role: SessionExercise['role'];
  body_region: SessionExercise['bodyRegion'];
  target_sets: number;
  target_rep_range_min: number;
  target_rep_range_max: number;
  target_weight: number | null;
  rest_seconds: number;
  swapped_from_exercise_id: string | null;
}

function toDomainSessionExercise(row: SessionExerciseRow): SessionExercise {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    slotId: row.slot_id,
    movementPattern: row.movement_pattern,
    orderIndex: row.order_index,
    role: row.role,
    bodyRegion: row.body_region,
    targetSets: row.target_sets,
    targetRepRange: [row.target_rep_range_min, row.target_rep_range_max],
    targetWeight: row.target_weight,
    restSeconds: row.rest_seconds,
    ...(row.swapped_from_exercise_id ? { swappedFromExerciseId: row.swapped_from_exercise_id } : {}),
  };
}

export async function getSessionsForMesocycle(mesocycleId: string): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('mesocycle_id', mesocycleId)
    .order('week_number', { ascending: true })
    .order('day_index', { ascending: true });
  if (error) throw error;
  return (data as SessionRow[]).map(toDomainSession);
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  const { data, error } = await supabase.from('workout_sessions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toDomainSession(data as SessionRow) : undefined;
}

export async function getNextPlannedSession(mesocycleId: string): Promise<WorkoutSession | undefined> {
  const sessions = await getSessionsForMesocycle(mesocycleId);
  return sessions.find((s) => s.status === 'planned' || s.status === 'in_progress');
}

export async function getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data as SessionExerciseRow[]).map(toDomainSessionExercise);
}

export async function startSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'planned');
  if (error) throw error;
}

export async function completeSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function skipSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'skipped', completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** True once every session in the mesocycle is completed or skipped (i.e. week 5 deload is done). */
export async function isMesocycleFinished(mesocycleId: string): Promise<boolean> {
  const sessions = await getSessionsForMesocycle(mesocycleId);
  return sessions.length > 0 && sessions.every((s) => s.status === 'completed' || s.status === 'skipped');
}

/** Swaps which exercise a session slot uses, e.g. because the gym's equipment is busy. */
export async function swapSessionExercise(sessionExerciseId: string, newExerciseId: string): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('session_exercises')
    .select('exercise_id, swapped_from_exercise_id')
    .eq('id', sessionExerciseId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!current) return;

  const { error } = await supabase
    .from('session_exercises')
    .update({
      exercise_id: newExerciseId,
      swapped_from_exercise_id: current.swapped_from_exercise_id ?? current.exercise_id,
    })
    .eq('id', sessionExerciseId);
  if (error) throw error;
}

/** Past sessions across all mesocycles, most recently completed first, for the History screen. */
export async function listCompletedSessions(): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .in('status', ['completed', 'skipped'])
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return (data as SessionRow[]).map(toDomainSession);
}
