import { describe, expect, it } from 'vitest';
import { generateMesocycle, resolveExercisesForTemplate } from './generateMesocycle';
import { PROGRAM_TEMPLATES } from './templates';
import { DEFAULT_PROGRESSION_RULES, type Exercise, type EquipmentTag } from '../types';

function makeExercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'movementPattern'>): Exercise {
  const now = new Date().toISOString();
  return {
    name: overrides.id,
    force: null,
    level: 'beginner',
    mechanic: 'compound',
    equipment: 'barbell',
    primaryMuscles: [],
    secondaryMuscles: [],
    muscleGroup: 'other',
    instructions: [],
    category: 'strength',
    source: 'seed',
    isHidden: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const FIXTURE_EXERCISES: Exercise[] = [
  makeExercise({ id: 'squat-1', movementPattern: 'squat' }),
  makeExercise({ id: 'hinge-1', movementPattern: 'hinge' }),
  makeExercise({ id: 'lunge-1', movementPattern: 'lunge' }),
  makeExercise({ id: 'push-1', movementPattern: 'push' }),
  makeExercise({ id: 'push-2', movementPattern: 'push' }),
  makeExercise({ id: 'pull-1', movementPattern: 'pull' }),
  makeExercise({ id: 'pull-2', movementPattern: 'pull' }),
  makeExercise({ id: 'core-1', movementPattern: 'core', equipment: 'bodyweight', mechanic: null }),
  makeExercise({ id: 'carry-1', movementPattern: 'carry', equipment: 'bodyweight', mechanic: null }),
];

const AVAILABLE_TAGS: ReadonlySet<EquipmentTag> = new Set(['barbell', 'bodyweight']);
const FULL_BODY = PROGRAM_TEMPLATES.find((t) => t.id === 'full_body_3x')!;

describe('resolveExercisesForTemplate', () => {
  it('resolves one exercise per slot, matching the required movement pattern', () => {
    const resolved = resolveExercisesForTemplate(FULL_BODY, FIXTURE_EXERCISES, AVAILABLE_TAGS);
    for (const day of FULL_BODY.dayDefinitions) {
      for (const slot of day.slots) {
        const exercise = resolved.get(slot.slotId);
        expect(exercise).toBeDefined();
        expect(exercise?.movementPattern).toBe(slot.movementPattern);
      }
    }
  });
});

describe('generateMesocycle', () => {
  const baselineWeights = { 'squat-1': 100, 'hinge-1': 100, 'lunge-1': 60, 'push-1': 60, 'pull-1': 60 };

  const { mesocycle, sessions } = generateMesocycle({
    template: FULL_BODY,
    exercises: FIXTURE_EXERCISES,
    availableTags: AVAILABLE_TAGS,
    goal: 'strength',
    baselineWeights,
    progressionSettings: DEFAULT_PROGRESSION_RULES,
    cycleNumber: 1,
    startDate: new Date().toISOString(),
  });

  it('generates exactly 5 weeks of sessions, one per template day', () => {
    const weekNumbers = new Set(sessions.map((s) => s.session.weekNumber));
    expect(weekNumbers).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(sessions.length).toBe(5 * FULL_BODY.dayDefinitions.length);
  });

  it('computes main-lift target weight from the baseline and week intensity', () => {
    const week1Squat = sessions
      .filter((s) => s.session.weekNumber === 1)
      .flatMap((s) => s.sessionExercises)
      .find((se) => se.exerciseId === 'squat-1');
    expect(week1Squat?.targetWeight).toBeGreaterThan(0);
    expect(week1Squat?.targetWeight).toBeLessThan(baselineWeights['squat-1']);
  });

  it('ramps intensity up from week 1 to week 4, then deloads at week 5', () => {
    const squatWeightByWeek = new Map<number, number>();
    for (const { session, sessionExercises } of sessions) {
      const squat = sessionExercises.find((se) => se.exerciseId === 'squat-1');
      if (squat?.targetWeight) squatWeightByWeek.set(session.weekNumber, squat.targetWeight);
    }
    expect(squatWeightByWeek.get(4)!).toBeGreaterThan(squatWeightByWeek.get(1)!);
    expect(squatWeightByWeek.get(5)!).toBeLessThan(squatWeightByWeek.get(4)!);
  });

  it('leaves bodyweight main/accessory lifts without a computed target weight', () => {
    const coreSets = sessions.flatMap((s) => s.sessionExercises).filter((se) => se.exerciseId === 'core-1');
    expect(coreSets.length).toBeGreaterThan(0);
    expect(coreSets.every((se) => se.targetWeight === null)).toBe(true);
  });

  it('tags the mesocycle with the given cycle number and template', () => {
    expect(mesocycle.cycleNumber).toBe(1);
    expect(mesocycle.programTemplateId).toBe(FULL_BODY.id);
    expect(mesocycle.status).toBe('active');
  });
});
