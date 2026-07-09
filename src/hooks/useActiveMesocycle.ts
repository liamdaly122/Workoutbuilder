import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

export function useActiveMesocycle() {
  return useLiveQuery(() => db.mesocycles.where('status').equals('active').first(), []);
}
