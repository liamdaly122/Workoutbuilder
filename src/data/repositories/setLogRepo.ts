import { db } from '../db';
import { generateId } from '../../lib/id';
import { detectPR } from '../../domain/metrics/prDetection';
import type { OneRepMaxFormula } from '../../domain/metrics/oneRepMax';
import type { SessionExercise, SetLog } from '../../domain/types';

export async function getSetLogsForSessionExercise(sessionExerciseId: string): Promise<SetLog[]> {
  const logs = await db.setLogs.where('sessionExerciseId').equals(sessionExerciseId).toArray();
  return logs.sort((a, b) => a.setIndex - b.setIndex);
}

/** Lazily materializes the planned (empty) set rows for a session exercise, once, on first access. */
export async function ensureSetLogsForSessionExercise(
  sessionExercise: SessionExercise,
): Promise<SetLog[]> {
  const existing = await getSetLogsForSessionExercise(sessionExercise.id);
  if (existing.length >= sessionExercise.targetSets) return existing;

  const toCreate: SetLog[] = [];
  for (let i = existing.length; i < sessionExercise.targetSets; i++) {
    toCreate.push({
      id: generateId('set'),
      sessionExerciseId: sessionExercise.id,
      setIndex: i,
      isWarmup: false,
      actualReps: null,
      actualWeight: null,
    });
  }
  if (toCreate.length > 0) await db.setLogs.bulkAdd(toCreate);
  return [...existing, ...toCreate];
}

interface LastPerformance {
  weight: number | null;
  reps: number | null;
  completedAt: string;
}

/** Most recent previously-logged performance for this exercise, for the Logger's prefill UX. */
export async function getLastPerformance(
  exerciseId: string,
  excludeSessionExerciseId?: string,
): Promise<LastPerformance | null> {
  const sessionExercises = await db.sessionExercises.where('exerciseId').equals(exerciseId).toArray();
  const relevantIds = sessionExercises
    .filter((se) => se.id !== excludeSessionExerciseId)
    .map((se) => se.id);
  if (relevantIds.length === 0) return null;

  const logs = await db.setLogs
    .where('sessionExerciseId')
    .anyOf(relevantIds)
    .and((log) => log.completedAt !== undefined && !log.isWarmup)
    .toArray();
  if (logs.length === 0) return null;

  logs.sort((a, b) => (b.completedAt as string).localeCompare(a.completedAt as string));
  const mostRecentSessionExerciseId = logs[0].sessionExerciseId;
  const lastSessionLogs = logs.filter((l) => l.sessionExerciseId === mostRecentSessionExerciseId);
  const best = lastSessionLogs.reduce((max, l) => ((l.actualWeight ?? 0) > (max.actualWeight ?? 0) ? l : max));

  return { weight: best.actualWeight, reps: best.actualReps, completedAt: best.completedAt as string };
}

export async function logSet(
  sessionExerciseId: string,
  setIndex: number,
  data: { actualWeight: number | null; actualReps: number | null; rpe?: number | null; isWarmup?: boolean },
  formula: OneRepMaxFormula = 'epley',
): Promise<SetLog> {
  const sessionExercise = await db.sessionExercises.get(sessionExerciseId);
  const existing = (await getSetLogsForSessionExercise(sessionExerciseId)).find(
    (l) => l.setIndex === setIndex,
  );

  let prResult: { isE1RMPR: boolean; isRepPR: boolean } = { isE1RMPR: false, isRepPR: false };
  if (
    !data.isWarmup &&
    sessionExercise &&
    data.actualWeight !== null &&
    data.actualReps !== null &&
    data.actualWeight > 0
  ) {
    const history = await getExerciseHistory(sessionExercise.exerciseId);
    prResult = detectPR(
      { weight: data.actualWeight, reps: data.actualReps },
      history
        .filter((h) => h.setLogId !== existing?.id)
        .map((h) => ({ weight: h.weight, reps: h.reps })),
      formula,
    );
  }

  const updated: SetLog = {
    id: existing?.id ?? generateId('set'),
    sessionExerciseId,
    setIndex,
    isWarmup: data.isWarmup ?? false,
    actualWeight: data.actualWeight,
    actualReps: data.actualReps,
    rpe: data.rpe ?? null,
    completedAt: new Date().toISOString(),
    isPR: prResult.isE1RMPR || prResult.isRepPR,
    prType: prResult.isE1RMPR ? 'e1rm' : prResult.isRepPR ? 'rep' : undefined,
  };

  await db.setLogs.put(updated);
  return updated;
}

export interface ExerciseHistoryEntry {
  setLogId: string;
  date: string;
  weight: number;
  reps: number;
  isPR: boolean;
  prType?: 'e1rm' | 'rep';
}

/** Full completed-set history for an exercise, oldest first, for progress charts and PR detection. */
export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
  const sessionExercises = await db.sessionExercises.where('exerciseId').equals(exerciseId).toArray();
  const seIds = sessionExercises.map((se) => se.id);
  if (seIds.length === 0) return [];

  const logs = await db.setLogs
    .where('sessionExerciseId')
    .anyOf(seIds)
    .and((log) => log.completedAt !== undefined && !log.isWarmup && log.actualWeight !== null && log.actualReps !== null)
    .toArray();

  return logs
    .map((log) => ({
      setLogId: log.id,
      date: log.completedAt as string,
      weight: log.actualWeight as number,
      reps: log.actualReps as number,
      isPR: log.isPR ?? false,
      prType: log.prType,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Distinct exerciseIds with at least one completed, non-warmup set - for the progress-screen picker. */
export async function getExerciseIdsWithHistory(): Promise<string[]> {
  const logs = await db.setLogs
    .filter((log) => log.completedAt !== undefined && !log.isWarmup && log.actualWeight !== null && log.actualReps !== null)
    .toArray();
  const sessionExerciseIds = [...new Set(logs.map((l) => l.sessionExerciseId))];
  const sessionExercises = await db.sessionExercises.bulkGet(sessionExerciseIds);
  return [...new Set(sessionExercises.filter((se) => se).map((se) => se!.exerciseId))];
}
