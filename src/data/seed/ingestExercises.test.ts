import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db';
import { ensureSeeded, SEED_VERSION } from './ingestExercises';
import type { Exercise } from '../../domain/types';

function makeSeedExercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name'>): Exercise {
  const now = new Date().toISOString();
  return {
    force: null,
    level: 'beginner',
    mechanic: 'compound',
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    muscleGroup: 'chest',
    instructions: [],
    category: 'strength',
    movementPattern: 'push',
    source: 'seed',
    isHidden: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const FIXTURE = [makeSeedExercise({ id: 'bench-press', name: 'Bench Press' })];

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => FIXTURE }) as Response),
  );
});

describe('ensureSeeded', () => {
  it('seeds exercises, program templates and week schemes on first run', async () => {
    await ensureSeeded();
    expect(await db.exercises.get('bench-press')).toBeDefined();
    expect(await db.programTemplates.count()).toBeGreaterThan(0);
    expect(await db.weekSchemes.count()).toBeGreaterThan(0);
    const settings = await db.settings.get('app');
    expect(settings?.seedVersion).toBe(SEED_VERSION);
  });

  it('is idempotent and does not clobber user favorite/hidden flags on re-seed', async () => {
    await ensureSeeded();
    await db.exercises.update('bench-press', { isFavorite: true, isHidden: true });

    // Force a re-seed pass by resetting the stored seed version.
    await db.settings.update('app', { seedVersion: '0' });
    await ensureSeeded();

    const exercise = await db.exercises.get('bench-press');
    expect(exercise?.isFavorite).toBe(true);
    expect(exercise?.isHidden).toBe(true);
    expect(exercise?.name).toBe('Bench Press');
  });

  it('never overwrites a custom exercise with a colliding id', async () => {
    await ensureSeeded();
    await db.exercises.update('bench-press', { source: 'custom', name: 'My Custom Bench' });

    await db.settings.update('app', { seedVersion: '0' });
    await ensureSeeded();

    const exercise = await db.exercises.get('bench-press');
    expect(exercise?.name).toBe('My Custom Bench');
    expect(exercise?.source).toBe('custom');
  });
});
