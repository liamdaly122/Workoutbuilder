import { generateId } from '../../lib/id';
import { isLoadable, pickExercise } from '../exercise/exerciseFilters';
import type {
  Exercise,
  EquipmentTag,
  Mesocycle,
  ProgramTemplate,
  ProgressionRuleSet,
  SessionExercise,
  TrainingGoal,
  WorkoutSession,
} from '../types';
import { getWeekScheme } from './weekSchemes';
import { roundToIncrement } from './progression';

/** Resolves exactly one exercise per (day, slot), reused across all 5 weeks so progression tracks the same lift. */
export function resolveExercisesForTemplate(
  template: ProgramTemplate,
  exercises: Exercise[],
  availableTags: ReadonlySet<EquipmentTag>,
): Map<string, Exercise> {
  const resolved = new Map<string, Exercise>();
  const assignedIds = new Set<string>();

  for (const dayDef of template.dayDefinitions) {
    for (const slot of dayDef.slots) {
      const exercise = pickExercise(slot, exercises, availableTags, assignedIds);
      if (exercise) {
        resolved.set(slot.slotId, exercise);
        assignedIds.add(exercise.id);
      }
    }
  }
  return resolved;
}

/** Slots (by slotId) that resolved to a main-lift exercise needing a starting weight, for onboarding to collect. */
export function mainLiftSlotsNeedingBaseline(
  template: ProgramTemplate,
  resolved: Map<string, Exercise>,
): Array<{ slotId: string; exercise: Exercise }> {
  const out: Array<{ slotId: string; exercise: Exercise }> = [];
  for (const dayDef of template.dayDefinitions) {
    for (const slot of dayDef.slots) {
      if (slot.role !== 'main') continue;
      const exercise = resolved.get(slot.slotId);
      if (exercise && isLoadable(exercise)) out.push({ slotId: slot.slotId, exercise });
    }
  }
  return out;
}

export interface GeneratedSession {
  session: WorkoutSession;
  sessionExercises: SessionExercise[];
}

export interface GeneratedMesocycle {
  mesocycle: Mesocycle;
  sessions: GeneratedSession[];
}

export interface GenerateMesocycleParams {
  template: ProgramTemplate;
  exercises: Exercise[];
  availableTags: ReadonlySet<EquipmentTag>;
  goal: TrainingGoal;
  /** exerciseId -> current working weight (kg), for loadable main lifts only. */
  baselineWeights: Record<string, number>;
  progressionSettings: ProgressionRuleSet;
  cycleNumber: number;
  startDate: string;
  previousMesocycleId?: string;
}

export function generateMesocycle(params: GenerateMesocycleParams): GeneratedMesocycle {
  const {
    template,
    exercises,
    availableTags,
    goal,
    baselineWeights,
    progressionSettings,
    cycleNumber,
    startDate,
    previousMesocycleId,
  } = params;

  const resolvedBySlot = resolveExercisesForTemplate(template, exercises, availableTags);

  const mesocycle: Mesocycle = {
    id: generateId('meso'),
    programTemplateId: template.id,
    goal,
    cycleNumber,
    startDate,
    status: 'active',
    baselineWeights,
    progressionSettings,
  };
  if (previousMesocycleId) mesocycle.previousMesocycleId = previousMesocycleId;

  const sessions: GeneratedSession[] = [];

  for (let weekNumber = 1; weekNumber <= 5; weekNumber++) {
    const scheme = getWeekScheme(goal, weekNumber as 1 | 2 | 3 | 4 | 5);

    for (const dayDef of template.dayDefinitions) {
      const session: WorkoutSession = {
        id: generateId('sess'),
        mesocycleId: mesocycle.id,
        weekNumber: weekNumber as 1 | 2 | 3 | 4 | 5,
        dayIndex: dayDef.dayIndex,
        label: dayDef.label,
        status: 'planned',
      };

      const sessionExercises: SessionExercise[] = [];
      dayDef.slots.forEach((slot, orderIndex) => {
        const exercise = resolvedBySlot.get(slot.slotId);
        if (!exercise) return;

        const track = slot.role === 'main' ? scheme.mainLift : scheme.accessory;
        const targetSets = Math.max(1, Math.round(slot.setCountBase * track.setsMultiplier));

        let targetWeight: number | null = null;
        if (slot.role === 'main' && isLoadable(exercise)) {
          const baseline = baselineWeights[exercise.id];
          if (baseline !== undefined) {
            const intensityPct = (track as typeof scheme.mainLift).intensityPct;
            targetWeight = roundToIncrement(baseline * intensityPct, progressionSettings.roundingIncrementKg);
          }
        }

        sessionExercises.push({
          id: generateId('sesex'),
          sessionId: session.id,
          exerciseId: exercise.id,
          slotId: slot.slotId,
          movementPattern: slot.movementPattern,
          orderIndex,
          role: slot.role,
          bodyRegion: slot.bodyRegion,
          targetSets,
          targetRepRange: track.repRange,
          targetWeight,
          restSeconds: slot.role === 'main' ? scheme.restSecondsMain : scheme.restSecondsAccessory,
        });
      });

      sessions.push({ session, sessionExercises });
    }
  }

  return { mesocycle, sessions };
}
