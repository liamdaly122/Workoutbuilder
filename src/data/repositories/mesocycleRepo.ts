import { supabase } from '../supabaseClient';
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

interface MesocycleRow {
  id: string;
  program_template_id: string;
  goal: Mesocycle['goal'];
  cycle_number: number;
  start_date: string;
  status: Mesocycle['status'];
  baseline_weights: Mesocycle['baselineWeights'];
  progression_settings: Mesocycle['progressionSettings'];
  previous_mesocycle_id: string | null;
}

function toDomainMesocycle(row: MesocycleRow): Mesocycle {
  return {
    id: row.id,
    programTemplateId: row.program_template_id,
    goal: row.goal,
    cycleNumber: row.cycle_number,
    startDate: row.start_date,
    status: row.status,
    baselineWeights: row.baseline_weights,
    progressionSettings: row.progression_settings,
    ...(row.previous_mesocycle_id ? { previousMesocycleId: row.previous_mesocycle_id } : {}),
  };
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

export async function createMesocycle(params: GenerateMesocycleParams): Promise<Mesocycle> {
  const { mesocycle, sessions } = generateMesocycle(params);
  const userId = await currentUserId();

  const mesocycleRow = {
    id: mesocycle.id,
    user_id: userId,
    program_template_id: mesocycle.programTemplateId,
    goal: mesocycle.goal,
    cycle_number: mesocycle.cycleNumber,
    start_date: mesocycle.startDate,
    status: mesocycle.status,
    baseline_weights: mesocycle.baselineWeights,
    progression_settings: mesocycle.progressionSettings,
    previous_mesocycle_id: mesocycle.previousMesocycleId ?? null,
  };
  const { error: mesoError } = await supabase.from('mesocycles').insert(mesocycleRow);
  if (mesoError) throw mesoError;

  const sessionRows = sessions.map(({ session }) => ({
    id: session.id,
    user_id: userId,
    mesocycle_id: session.mesocycleId,
    week_number: session.weekNumber,
    day_index: session.dayIndex,
    label: session.label,
    status: session.status,
  }));
  const { error: sessionError } = await supabase.from('workout_sessions').insert(sessionRows);
  if (sessionError) throw sessionError;

  const sessionExerciseRows = sessions.flatMap(({ sessionExercises }) =>
    sessionExercises.map((se) => ({
      id: se.id,
      user_id: userId,
      session_id: se.sessionId,
      exercise_id: se.exerciseId,
      slot_id: se.slotId,
      movement_pattern: se.movementPattern,
      order_index: se.orderIndex,
      role: se.role,
      body_region: se.bodyRegion,
      target_sets: se.targetSets,
      target_rep_range_min: se.targetRepRange[0],
      target_rep_range_max: se.targetRepRange[1],
      target_weight: se.targetWeight,
      rest_seconds: se.restSeconds,
      swapped_from_exercise_id: se.swappedFromExerciseId ?? null,
    })),
  );
  if (sessionExerciseRows.length > 0) {
    const { error: seError } = await supabase.from('session_exercises').insert(sessionExerciseRows);
    if (seError) throw seError;
  }

  return mesocycle;
}

/**
 * Returns `null` (not `undefined`) when there's genuinely no active mesocycle,
 * so React Query's `data` can distinguish "still loading" (undefined) from
 * "loaded, and there isn't one" (null) - the Today screen relies on this.
 */
export async function getActiveMesocycle(): Promise<Mesocycle | null> {
  const { data, error } = await supabase
    .from('mesocycles')
    .select('*')
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data ? toDomainMesocycle(data as MesocycleRow) : null;
}

export async function getMesocycle(id: string): Promise<Mesocycle | undefined> {
  const { data, error } = await supabase.from('mesocycles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toDomainMesocycle(data as MesocycleRow) : undefined;
}

export async function markMesocycleCompleted(id: string): Promise<void> {
  const { error } = await supabase.from('mesocycles').update({ status: 'completed' }).eq('id', id);
  if (error) throw error;
}

export async function markMesocycleAbandoned(id: string): Promise<void> {
  const { error } = await supabase.from('mesocycles').update({ status: 'abandoned' }).eq('id', id);
  if (error) throw error;
}

interface Week4Row {
  week_number: number;
  session_exercises: Array<{
    exercise_id: string;
    body_region: CompletedMainLiftSet['bodyRegion'];
    target_rep_range_min: number;
    target_rep_range_max: number;
    target_weight: number | null;
    set_logs: Array<{ actual_reps: number | null; actual_weight: number | null; is_warmup: boolean }>;
  }>;
}

/** Builds next-cycle weight suggestions from the completed mesocycle's week-4 (peak) performance. */
export async function suggestNextCycleBaselines(mesocycle: Mesocycle): Promise<NextCycleSuggestion[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `week_number,
       session_exercises!inner (
         exercise_id, body_region, target_rep_range_min, target_rep_range_max, target_weight,
         set_logs ( actual_reps, actual_weight, is_warmup )
       )`,
    )
    .eq('mesocycle_id', mesocycle.id)
    .eq('week_number', 4)
    .eq('session_exercises.role', 'main')
    .not('session_exercises.target_weight', 'is', null);
  if (error) throw error;

  const byExercise = new Map<string, CompletedMainLiftSet[]>();
  for (const session of data as Week4Row[]) {
    for (const se of session.session_exercises) {
      const entries: CompletedMainLiftSet[] = se.set_logs
        .filter((log) => !log.is_warmup)
        .map((log) => ({
          exerciseId: se.exercise_id,
          bodyRegion: se.body_region,
          targetReps: [se.target_rep_range_min, se.target_rep_range_max],
          targetWeight: se.target_weight as number,
          actualReps: log.actual_reps,
          actualWeight: log.actual_weight,
        }));
      byExercise.set(se.exercise_id, [...(byExercise.get(se.exercise_id) ?? []), ...entries]);
    }
  }

  return computeNextCycleBaseline(byExercise, mesocycle.progressionSettings);
}
