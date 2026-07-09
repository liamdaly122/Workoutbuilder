import { db } from '../db';
import type { Settings } from '../../domain/types';

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get('app');
  if (!settings) throw new Error('Settings not initialized - ensureSeeded() must run first');
  return settings;
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  await db.settings.update('app', patch);
}
