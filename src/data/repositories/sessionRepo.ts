import { db } from '../db';
import type { SessionExercise, WorkoutSession } from '../../domain/types';

export async function getSessionsForMesocycle(mesocycleId: string): Promise<WorkoutSession[]> {
  const sessions = await db.workoutSessions.where('mesocycleId').equals(mesocycleId).toArray();
  return sessions.sort((a, b) => a.weekNumber - b.weekNumber || a.dayIndex - b.dayIndex);
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.get(id);
}

export async function getNextPlannedSession(mesocycleId: string): Promise<WorkoutSession | undefined> {
  const sessions = await getSessionsForMesocycle(mesocycleId);
  return sessions.find((s) => s.status === 'planned' || s.status === 'in_progress');
}

export async function getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
  const exercises = await db.sessionExercises.where('sessionId').equals(sessionId).toArray();
  return exercises.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function startSession(id: string): Promise<void> {
  const session = await db.workoutSessions.get(id);
  if (session && session.status === 'planned') {
    await db.workoutSessions.update(id, { status: 'in_progress', startedAt: new Date().toISOString() });
  }
}

export async function completeSession(id: string): Promise<void> {
  await db.workoutSessions.update(id, { status: 'completed', completedAt: new Date().toISOString() });
}

export async function skipSession(id: string): Promise<void> {
  await db.workoutSessions.update(id, { status: 'skipped', completedAt: new Date().toISOString() });
}

/** True once every session in the mesocycle is completed or skipped (i.e. week 5 deload is done). */
export async function isMesocycleFinished(mesocycleId: string): Promise<boolean> {
  const sessions = await getSessionsForMesocycle(mesocycleId);
  return sessions.length > 0 && sessions.every((s) => s.status === 'completed' || s.status === 'skipped');
}

/** Swaps which exercise a session slot uses, e.g. because the gym's equipment is busy. */
export async function swapSessionExercise(sessionExerciseId: string, newExerciseId: string): Promise<void> {
  const current = await db.sessionExercises.get(sessionExerciseId);
  if (!current) return;
  await db.sessionExercises.update(sessionExerciseId, {
    exerciseId: newExerciseId,
    swappedFromExerciseId: current.swappedFromExerciseId ?? current.exerciseId,
  });
}

/** Past sessions across all mesocycles, most recently completed first, for the History screen. */
export async function listCompletedSessions(): Promise<WorkoutSession[]> {
  const sessions = await db.workoutSessions
    .filter((s) => s.status === 'completed' || s.status === 'skipped')
    .toArray();
  return sessions.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}
