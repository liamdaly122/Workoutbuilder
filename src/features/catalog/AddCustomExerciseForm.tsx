import { useState } from 'react';
import { addCustomExercise } from '../../data/repositories/exerciseRepo';
import { EQUIPMENT_CATALOG } from '../../data/seed/equipmentMap';
import type { EquipmentTag, MovementPattern } from '../../domain/types';
import { Button } from '../../components/Button';

const MOVEMENT_PATTERNS: MovementPattern[] = [
  'squat',
  'hinge',
  'lunge',
  'push',
  'pull',
  'carry',
  'core',
  'other',
];
const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'neck', 'other'];

export function AddCustomExerciseForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState<EquipmentTag>('barbell');
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('other');
  const [muscleGroup, setMuscleGroup] = useState('chest');

  async function handleSubmit() {
    if (!name.trim()) return;
    await addCustomExercise({
      name: name.trim(),
      equipment,
      movementPattern,
      muscleGroup,
      primaryMuscles: [muscleGroup],
    });
    onDone();
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
      <input
        placeholder="Exercise name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
      />
      <div className="flex gap-2">
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as EquipmentTag)}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm text-white"
        >
          {EQUIPMENT_CATALOG.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.label}
            </option>
          ))}
        </select>
        <select
          value={movementPattern}
          onChange={(e) => setMovementPattern(e.target.value as MovementPattern)}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm text-white"
        >
          {MOVEMENT_PATTERNS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <select
        value={muscleGroup}
        onChange={(e) => setMuscleGroup(e.target.value)}
        className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm text-white"
      >
        {MUSCLE_GROUPS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <Button onClick={handleSubmit}>Add exercise</Button>
    </div>
  );
}
