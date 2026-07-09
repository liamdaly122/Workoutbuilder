import { supabase } from '../supabaseClient';
import { EQUIPMENT_CATALOG } from '../seed/equipmentMap';
import type { EquipmentItem, EquipmentTag } from '../../domain/types';

interface EquipmentRow {
  equipment_tag: EquipmentTag;
  available: boolean;
  min_load_kg: number | null;
  max_load_kg: number | null;
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

export async function getEquipmentInventory(): Promise<EquipmentItem[]> {
  const { data, error } = await supabase
    .from('equipment_inventory')
    .select('equipment_tag, available, min_load_kg, max_load_kg');
  if (error) throw error;

  const rowByTag = new Map((data as EquipmentRow[]).map((r) => [r.equipment_tag, r]));

  return EQUIPMENT_CATALOG.map((item) => {
    const row = rowByTag.get(item.id);
    return {
      id: item.id,
      label: item.label,
      available: row?.available ?? item.id === 'bodyweight',
      minLoadKg: row?.min_load_kg ?? undefined,
      maxLoadKg: row?.max_load_kg ?? undefined,
    };
  });
}

export async function setEquipmentAvailability(id: EquipmentTag, available: boolean): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('equipment_inventory')
    .upsert({ user_id: userId, equipment_tag: id, available }, { onConflict: 'user_id,equipment_tag' });
  if (error) throw error;
}

export async function getAvailableEquipmentTags(): Promise<Set<EquipmentTag>> {
  const inventory = await getEquipmentInventory();
  return new Set(inventory.filter((i) => i.available).map((i) => i.id));
}
