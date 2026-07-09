import { exportDB } from 'dexie-export-import';
import { db } from './db';

export async function exportDatabaseToFile(): Promise<void> {
  const blob = await exportDB(db);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `workoutbuilder-backup-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Wipes all local data and replaces it with the contents of a previously exported backup file. */
export async function importDatabaseFromFile(file: File): Promise<void> {
  await db.import(file, { clearTablesBeforeImport: true });
}
