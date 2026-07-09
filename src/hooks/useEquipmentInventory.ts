import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

export function useEquipmentInventory() {
  return useLiveQuery(() => db.equipmentInventory.toArray(), []);
}
