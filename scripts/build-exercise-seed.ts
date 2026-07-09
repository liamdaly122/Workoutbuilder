// Regenerates public/data/exercises.json from the public-domain free-exercise-db dataset.
// Run with: npx tsx scripts/build-exercise-seed.ts
import { writeFileSync } from 'node:fs';
import { normalizeEquipment, inferMuscleGroup } from '../src/data/seed/equipmentMap';
import { inferMovementPattern, PULL_UP_BAR_NAME_TEST } from '../src/data/seed/movementPatternMap';
import type { Exercise } from '../src/domain/types';

const SOURCE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

interface SourceExercise {
  id: string;
  name: string;
  force: 'push' | 'pull' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
}

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Failed to fetch source dataset: HTTP ${res.status}`);
  const source: SourceExercise[] = await res.json();

  const now = new Date().toISOString();
  const transformed: Exercise[] = source.map((s) => {
    let equipment = normalizeEquipment(s.equipment);
    if (equipment === 'bodyweight' && PULL_UP_BAR_NAME_TEST.test(s.name)) {
      equipment = 'pull_up_bar';
    }
    return {
      id: s.id,
      name: s.name,
      force: s.force,
      level: s.level,
      mechanic: s.mechanic,
      equipment,
      primaryMuscles: s.primaryMuscles,
      secondaryMuscles: s.secondaryMuscles,
      muscleGroup: inferMuscleGroup(s.primaryMuscles),
      instructions: s.instructions,
      category: s.category,
      movementPattern: inferMovementPattern(s.name),
      source: 'seed',
      isHidden: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
  });

  writeFileSync(
    new URL('../public/data/exercises.json', import.meta.url),
    JSON.stringify(transformed, null, 2) + '\n',
  );
  console.log(`Wrote ${transformed.length} exercises to public/data/exercises.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
