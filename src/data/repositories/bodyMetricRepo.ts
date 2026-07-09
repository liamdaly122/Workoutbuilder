import { supabase } from '../supabaseClient';
import { generateId } from '../../lib/id';
import type { BodyMetric } from '../../domain/types';

interface BodyMetricRow {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  notes: string | null;
}

function toDomainBodyMetric(row: BodyMetricRow): BodyMetric {
  return {
    id: row.id,
    date: row.date,
    ...(row.weight_kg !== null ? { weightKg: row.weight_kg } : {}),
    ...(row.body_fat_pct !== null ? { bodyFatPct: row.body_fat_pct } : {}),
    ...(row.notes !== null ? { notes: row.notes } : {}),
  };
}

export async function listBodyMetrics(): Promise<BodyMetric[]> {
  const { data, error } = await supabase.from('body_metrics').select('*').order('date', { ascending: true });
  if (error) throw error;
  return (data as BodyMetricRow[]).map(toDomainBodyMetric);
}

export async function addBodyMetric(entry: Omit<BodyMetric, 'id'>): Promise<BodyMetric> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const row = {
    id: generateId('bm'),
    user_id: user.id,
    date: entry.date,
    weight_kg: entry.weightKg ?? null,
    body_fat_pct: entry.bodyFatPct ?? null,
    notes: entry.notes ?? null,
  };
  const { data, error } = await supabase.from('body_metrics').insert(row).select().single();
  if (error) throw error;
  return toDomainBodyMetric(data as BodyMetricRow);
}

export async function deleteBodyMetric(id: string): Promise<void> {
  const { error } = await supabase.from('body_metrics').delete().eq('id', id);
  if (error) throw error;
}
