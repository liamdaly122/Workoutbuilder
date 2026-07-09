import { db } from '../db';
import {
  generateMesocycle,
  type GenerateMesocycleParams,
} from '../../domain/program/generateMesocycle';
import {
  computeNextCycleBaseline,
  type CompletedMainLiftSet,
  type NextCycleSuggestion,
} from '../../domain/program/progression';
import type { Mesocycle } from '../../domain/types';

export async function createMesocycle(params: GenerateMesocycleParams): Promise<Mesocycle> {
  const { mesocycle, sessions } = generateMesocycle(params);

  await db.transaction(
    'rw',
    db.mesocycles,
    db.workoutSessions,
    db.sessionExercises,
    async () => {
      await db.mesocycles.add(mesocycle);
      for (const { session, sessionExercises } of sessions) {
        await db.workoutSessions.add(session);
        if (sessionExercises.length > 0) await db.sessionExercises.bulkAdd(sessionExercises);
      }
    },
  );

  return mesocycle;
}

export async function getActiveMesocycle(): Promise<Mesocycle | undefined> {
  return db.mesocycles.where('status').equals('active').first();
}

export async function getMesocycle(id: string): Promise<Mesocycle | undefined> {
  return db.mesocycles.get(id);
}

export async function markMesocycleCompleted(id: string): Promise<void> {
  await db.mesocycles.update(id, { status: 'completed' });
}

export async function markMesocycleAbandoned(id: string): Promise<void> {
  await db.mesocycles.update(id, { status: 'abandoned' });
}

/** Builds next-cycle weight suggestions from the completed mesocycle's week-4 (peak) performance. */
export async function suggestNextCycleBaselines(mesocycle: Mesocycle): Promise<NextCycleSuggestion[]> {
  const week4Sessions = await db.workoutSessions
    .where('[mesocycleId+weekNumber]')
    .equals([mesocycle.id, 4])
    .toArray();

  const week4SessionIds = new Set(week4Sessions.map((s) => s.id));
  const allSessionExercises = await db.sessionExercises.toArray();
  const week4SessionExercises = allSessionExercises.filter(
    (se) => week4SessionIds.has(se.sessionId) && se.role === 'main' && se.targetWeight !== null,
  );

  const byExercise = new Map<string, CompletedMainLiftSet[]>();
  for (const se of week4SessionExercises) {
    const setLogs = await db.setLogs
      .where('sessionExerciseId')
      .equals(se.id)
      .and((s) => !s.isWarmup)
      .toArray();

    const entries: CompletedMainLiftSet[] = setLogs.map((log) => ({
      exerciseId: se.exerciseId,
      bodyRegion: se.bodyRegion,
      targetReps: se.targetRepRange,
      targetWeight: se.targetWeight as number,
      actualReps: log.actualReps,
      actualWeight: log.actualWeight,
    }));

    const existing = byExercise.get(se.exerciseId) ?? [];
    byExercise.set(se.exerciseId, [...existing, ...entries]);
  }

  return computeNextCycleBaseline(byExercise, mesocycle.progressionSettings);
}
