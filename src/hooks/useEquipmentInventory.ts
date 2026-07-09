import { useQuery } from '@tanstack/react-query';
import { getEquipmentInventory } from '../data/repositories/equipmentRepo';

export function useEquipmentInventory() {
  const query = useQuery({ queryKey: ['equipmentInventory'], queryFn: getEquipmentInventory });
  return query.data;
}
