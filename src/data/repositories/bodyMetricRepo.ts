import { db } from '../db';
import { generateId } from '../../lib/id';
import type { BodyMetric } from '../../domain/types';

export async function listBodyMetrics(): Promise<BodyMetric[]> {
  const metrics = await db.bodyMetrics.toArray();
  return metrics.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addBodyMetric(entry: Omit<BodyMetric, 'id'>): Promise<BodyMetric> {
  const metric: BodyMetric = { id: generateId('bm'), ...entry };
  await db.bodyMetrics.add(metric);
  return metric;
}

export async function deleteBodyMetric(id: string): Promise<void> {
  await db.bodyMetrics.delete(id);
}
