import { supabase } from '../supabaseClient';
import { generateId } from '../../lib/id';
import { detectPR } from '../../domain/metrics/prDetection';
import type { OneRepMaxFormula } from '../../domain/metrics/oneRepMax';
import type { SessionExercise, SetLog } from '../../domain/types';

interface SetLogRow {
  id: string;
  session_exercise_id: string;
  set_index: number;
  is_warmup: boolean;
  actual_reps: number | null;
  actual_weight: number | null;
  rpe: number | null;
  completed_at: string | null;
  is_pr: boolean;
  pr_type: SetLog['prType'] | null;
}

function toDomainSetLog(row: SetLogRow): SetLog {
  return {
    id: row.id,
    sessionExerciseId: row.session_exercise_id,
    setIndex: row.set_index,
    isWarmup: row.is_warmup,
    actualReps: row.actual_reps,
    actualWeight: row.actual_weight,
    rpe: row.rpe,
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    isPR: row.is_pr,
    ...(row.pr_type ? { prType: row.pr_type } : {}),
  };
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

export async function getSetLogsForSessionExercise(sessionExerciseId: string): Promise<SetLog[]> {
  const { data, error } = await supabase
    .from('set_logs')
    .select('*')
    .eq('session_exercise_id', sessionExerciseId)
    .order('set_index', { ascending: true });
  if (error) throw error;
  return (data as SetLogRow[]).map(toDomainSetLog);
}

/** Lazily materializes the planned (empty) set rows for a session exercise, once, on first access. */
export async function ensureSetLogsForSessionExercise(
  sessionExercise: SessionExercise,
): Promise<SetLog[]> {
  const existing = await getSetLogsForSessionExercise(sessionExercise.id);
  if (existing.length >= sessionExercise.targetSets) return existing;

  const userId = await currentUserId();
  const toCreate = [];
  for (let i = existing.length; i < sessionExercise.targetSets; i++) {
    toCreate.push({
      id: generateId('set'),
      user_id: userId,
      session_exercise_id: sessionExercise.id,
      set_index: i,
      is_warmup: false,
      actual_reps: null,
      actual_weight: null,
    });
  }
  if (toCreate.length > 0) {
    const { error } = await supabase.from('set_logs').insert(toCreate);
    if (error) throw error;
  }
  return getSetLogsForSessionExercise(sessionExercise.id);
}

interface LastPerformance {
  weight: number | null;
  reps: number | null;
  completedAt: string;
}

interface SetLogWithSessionExerciseRow {
  id: string;
  session_exercise_id: string;
  actual_weight: number | null;
  actual_reps: number | null;
  completed_at: string | null;
}

/** Most recent previously-logged performance for this exercise, for the Logger's prefill UX. */
export async function getLastPerformance(
  exerciseId: string,
  excludeSessionExerciseId?: string,
): Promise<LastPerformance | null> {
  const { data: sessionExercises, error: seError } = await supabase
    .from('session_exercises')
    .select('id')
    .eq('exercise_id', exerciseId);
  if (seError) throw seError;

  const relevantIds = sessionExercises
    .map((se) => se.id as string)
    .filter((id) => id !== excludeSessionExerciseId);
  if (relevantIds.length === 0) return null;

  const { data, error } = await supabase
    .from('set_logs')
    .select('id, session_exercise_id, actual_weight, actual_reps, completed_at')
    .in('session_exercise_id', relevantIds)
    .eq('is_warmup', false)
    .not('completed_at', 'is', null);
  if (error) throw error;

  const logs = data as SetLogWithSessionExerciseRow[];
  if (logs.length === 0) return null;

  logs.sort((a, b) => (b.completed_at as string).localeCompare(a.completed_at as string));
  const mostRecentSessionExerciseId = logs[0].session_exercise_id;
  const lastSessionLogs = logs.filter((l) => l.session_exercise_id === mostRecentSessionExerciseId);
  const best = lastSessionLogs.reduce((max, l) => ((l.actual_weight ?? 0) > (max.actual_weight ?? 0) ? l : max));

  return { weight: best.actual_weight, reps: best.actual_reps, completedAt: best.completed_at as string };
}

export async function logSet(
  sessionExerciseId: string,
  setIndex: number,
  data: { actualWeight: number | null; actualReps: number | null; rpe?: number | null; isWarmup?: boolean },
  formula: OneRepMaxFormula = 'epley',
): Promise<SetLog> {
  const userId = await currentUserId();
  const { data: sessionExercise } = await supabase
    .from('session_exercises')
    .select('exercise_id')
    .eq('id', sessionExerciseId)
    .maybeSingle();
  const existingLogs = await getSetLogsForSessionExercise(sessionExerciseId);
  const existing = existingLogs.find((l) => l.setIndex === setIndex);

  let prResult: { isE1RMPR: boolean; isRepPR: boolean } = { isE1RMPR: false, isRepPR: false };
  if (
    !data.isWarmup &&
    sessionExercise &&
    data.actualWeight !== null &&
    data.actualReps !== null &&
    data.actualWeight > 0
  ) {
    const history = await getExerciseHistory(sessionExercise.exercise_id);
    prResult = detectPR(
      { weight: data.actualWeight, reps: data.actualReps },
      history
        .filter((h) => h.setLogId !== existing?.id)
        .map((h) => ({ weight: h.weight, reps: h.reps })),
      formula,
    );
  }

  const row = {
    id: existing?.id ?? generateId('set'),
    user_id: userId,
    session_exercise_id: sessionExerciseId,
    set_index: setIndex,
    is_warmup: data.isWarmup ?? false,
    actual_weight: data.actualWeight,
    actual_reps: data.actualReps,
    rpe: data.rpe ?? null,
    completed_at: new Date().toISOString(),
    is_pr: prResult.isE1RMPR || prResult.isRepPR,
    pr_type: prResult.isE1RMPR ? 'e1rm' : prResult.isRepPR ? 'rep' : null,
  };

  const { data: saved, error } = await supabase.from('set_logs').upsert(row).select().single();
  if (error) throw error;
  return toDomainSetLog(saved as SetLogRow);
}

export interface ExerciseHistoryEntry {
  setLogId: string;
  date: string;
  weight: number;
  reps: number;
  isPR: boolean;
  prType?: 'e1rm' | 'rep';
}

interface ExerciseHistoryRow {
  exercise_id: string;
  set_logs: Array<{
    id: string;
    completed_at: string | null;
    actual_weight: number | null;
    actual_reps: number | null;
    is_pr: boolean;
    pr_type: 'e1rm' | 'rep' | null;
    is_warmup: boolean;
  }>;
}

/** Full completed-set history for an exercise, oldest first, for progress charts and PR detection. */
export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select('exercise_id, set_logs(id, completed_at, actual_weight, actual_reps, is_pr, pr_type, is_warmup)')
    .eq('exercise_id', exerciseId);
  if (error) throw error;

  const entries: ExerciseHistoryEntry[] = [];
  for (const row of data as ExerciseHistoryRow[]) {
    for (const log of row.set_logs) {
      if (log.is_warmup || log.completed_at === null || log.actual_weight === null || log.actual_reps === null)
        continue;
      entries.push({
        setLogId: log.id,
        date: log.completed_at,
        weight: log.actual_weight,
        reps: log.actual_reps,
        isPR: log.is_pr,
        prType: log.pr_type ?? undefined,
      });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/** Distinct exerciseIds with at least one completed, non-warmup set - for the progress-screen picker. */
export async function getExerciseIdsWithHistory(): Promise<string[]> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select('exercise_id, set_logs!inner(is_warmup, completed_at, actual_weight, actual_reps)')
    .eq('set_logs.is_warmup', false)
    .not('set_logs.completed_at', 'is', null)
    .not('set_logs.actual_weight', 'is', null)
    .not('set_logs.actual_reps', 'is', null);
  if (error) throw error;
  return [...new Set((data as Array<{ exercise_id: string }>).map((row) => row.exercise_id))];
}
