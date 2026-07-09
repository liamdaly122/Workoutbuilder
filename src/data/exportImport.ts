import { supabase } from './supabaseClient';

const TABLES = [
  'exercises',
  'exercise_preferences',
  'equipment_inventory',
  'mesocycles',
  'workout_sessions',
  'session_exercises',
  'set_logs',
  'body_metrics',
  'settings',
] as const;

/**
 * Downloads a JSON copy of everything in your account, as a personal safety
 * net - Supabase's free tier doesn't include long-term backups. This is a
 * point-in-time copy for your own records, not a restore/import feature:
 * your Supabase database is the durable, always-current copy of your data.
 */
export async function exportMyDataToFile(): Promise<void> {
  const result: Record<string, unknown> = {};

  for (const table of TABLES) {
    // exercises is a shared table; only export the rows you own (custom exercises),
    // not the whole seeded catalog.
    const query =
      table === 'exercises'
        ? supabase.from(table).select('*').not('owner_id', 'is', null)
        : supabase.from(table).select('*');

    const { data, error } = await query;
    if (error) throw error;
    result[table] = data;
  }

  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `workoutbuilder-export-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
