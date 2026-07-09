import { db } from '../db';
import { DEFAULT_PROGRESSION_RULES, type Exercise, type Settings } from '../../domain/types';
import { PROGRAM_TEMPLATES } from '../../domain/program/templates';
import { ALL_WEEK_SCHEMES } from '../../domain/program/weekSchemes';

export const SEED_VERSION = '1';

// Fetched as a static asset (public/data/exercises.json) rather than bundled into the JS,
// since it's ~1MB and only ever needed once per SEED_VERSION bump.
async function fetchSeedExercises(): Promise<Exercise[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
  if (!res.ok) throw new Error(`Failed to load exercise seed data: HTTP ${res.status}`);
  return res.json();
}

const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  unitSystem: 'kg',
  goal: 'general',
  onboardingCompleted: false,
  restTimerDefaults: { mainSec: 90, accessorySec: 60 },
  progressionRuleSet: DEFAULT_PROGRESSION_RULES,
  oneRepMaxFormula: 'epley',
  seedVersion: SEED_VERSION,
};

/**
 * Idempotent, version-gated seeding: safe to call on every app launch. Existing
 * seed-sourced exercises get their catalog fields refreshed without touching
 * user-owned isFavorite/isHidden flags or any source:'custom' rows.
 */
export async function ensureSeeded(): Promise<void> {
  const settings = await db.settings.get('app');

  if (!settings) {
    await db.settings.add(DEFAULT_SETTINGS);
  }
  if (settings && settings.seedVersion === SEED_VERSION) {
    await ensureProgramDataSeeded();
    return;
  }

  const seedExercises = await fetchSeedExercises();

  await db.transaction('rw', db.exercises, db.settings, async () => {
    for (const entry of seedExercises) {
      const existing = await db.exercises.get(entry.id);
      if (!existing) {
        await db.exercises.add(entry);
      } else if (existing.source === 'seed') {
        await db.exercises.update(entry.id, {
          name: entry.name,
          force: entry.force,
          level: entry.level,
          mechanic: entry.mechanic,
          equipment: entry.equipment,
          primaryMuscles: entry.primaryMuscles,
          secondaryMuscles: entry.secondaryMuscles,
          muscleGroup: entry.muscleGroup,
          instructions: entry.instructions,
          category: entry.category,
          movementPattern: entry.movementPattern,
          updatedAt: entry.updatedAt,
        });
      }
      // source === 'custom' rows with a colliding id are left untouched.
    }
    await db.settings.update('app', { seedVersion: SEED_VERSION });
  });

  await ensureProgramDataSeeded();
}

async function ensureProgramDataSeeded(): Promise<void> {
  const templateCount = await db.programTemplates.count();
  if (templateCount === 0) {
    await db.programTemplates.bulkAdd(PROGRAM_TEMPLATES);
  }
  const schemeCount = await db.weekSchemes.count();
  if (schemeCount === 0) {
    await db.weekSchemes.bulkAdd(ALL_WEEK_SCHEMES);
  }
}
