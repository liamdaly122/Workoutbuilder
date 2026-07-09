import { db } from '../db';
import { EQUIPMENT_CATALOG } from '../seed/equipmentMap';
import type { EquipmentItem, EquipmentTag } from '../../domain/types';

export async function getEquipmentInventory(): Promise<EquipmentItem[]> {
  const existing = await db.equipmentInventory.toArray();
  if (existing.length > 0) return existing;

  const defaults: EquipmentItem[] = EQUIPMENT_CATALOG.map((item) => ({
    id: item.id,
    label: item.label,
    available: item.id === 'bodyweight',
  }));
  await db.equipmentInventory.bulkAdd(defaults);
  return defaults;
}

export async function setEquipmentAvailability(id: EquipmentTag, available: boolean): Promise<void> {
  await db.equipmentInventory.update(id, { available });
}

export async function getAvailableEquipmentTags(): Promise<Set<EquipmentTag>> {
  const inventory = await getEquipmentInventory();
  return new Set(inventory.filter((i) => i.available).map((i) => i.id));
}
