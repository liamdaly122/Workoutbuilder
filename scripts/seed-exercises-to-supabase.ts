// One-time upload of the exercise catalog (public/data/exercises.json) into your
// Supabase project's `exercises` table. Safe to re-run if you ever regenerate
// exercises.json - it upserts by id, refreshing catalog fields without touching
// anyone's custom exercises (which have a different id scheme) or preferences.
//
// Run with: npm run seed:supabase
// Requires .env.local with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set
// (see .env.example / SETUP.md). The service role key is required because this
// creates shared rows (owner_id null), which regular signed-in users cannot do.
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (existsSync(new URL('../.env.local', import.meta.url))) {
  process.loadEnvFile(new URL('../.env.local', import.meta.url));
}

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Create a .env.local file (see .env.example) with both values from your Supabase project settings.',
  );
  process.exit(1);
}

interface SeedExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleGroup: string;
  instructions: string[];
  category: string;
  movementPattern: string;
}

async function main() {
  const raw = readFileSync(new URL('../public/data/exercises.json', import.meta.url), 'utf-8');
  const exercises: SeedExercise[] = JSON.parse(raw);

  const supabase = createClient(url!, serviceRoleKey!);
  const now = new Date().toISOString();

  const rows = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    force: e.force,
    level: e.level,
    mechanic: e.mechanic,
    equipment: e.equipment,
    primary_muscles: e.primaryMuscles,
    secondary_muscles: e.secondaryMuscles,
    muscle_group: e.muscleGroup,
    instructions: e.instructions,
    category: e.category,
    movement_pattern: e.movementPattern,
    source: 'seed',
    owner_id: null,
    updated_at: now,
  }));

  const BATCH_SIZE = 200;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('exercises').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Failed on batch starting at row ${i}:`, error.message);
      process.exit(1);
    }
    console.log(`Uploaded ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log(`Done - seeded ${rows.length} exercises.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
