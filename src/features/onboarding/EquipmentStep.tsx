import { useEffect, useState } from 'react';
import { getEquipmentInventory, setEquipmentAvailability } from '../../data/repositories/equipmentRepo';
import type { EquipmentItem } from '../../domain/types';
import { Button } from '../../components/Button';
import { EquipmentGrid } from '../../components/EquipmentGrid';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function EquipmentStep({ onNext, onBack }: Props) {
  const [items, setItems] = useState<EquipmentItem[] | null>(null);

  useEffect(() => {
    getEquipmentInventory().then(setItems);
  }, []);

  async function toggle(item: EquipmentItem) {
    if (item.id === 'bodyweight') return;
    const nextAvailable = !item.available;
    await setEquipmentAvailability(item.id, nextAvailable);
    setItems((prev) =>
      prev ? prev.map((i) => (i.id === item.id ? { ...i, available: nextAvailable } : i)) : prev,
    );
  }

  if (!items) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">What do you have access to?</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your plan only uses exercises that match this list. Change it any time in Settings.
        </p>
      </div>
      <EquipmentGrid items={items} onToggle={toggle} />
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
