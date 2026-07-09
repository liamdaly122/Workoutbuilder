import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

export function useSettings() {
  return useLiveQuery(() => db.settings.get('app'), []);
}
