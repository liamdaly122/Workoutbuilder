import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listExercises } from '../../data/repositories/exerciseRepo';
import { EQUIPMENT_CATALOG } from '../../data/seed/equipmentMap';
import type { EquipmentTag } from '../../domain/types';
import { AddCustomExerciseForm } from './AddCustomExerciseForm';
import { Button } from '../../components/Button';

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'neck', 'other'];

export function CatalogScreen() {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState<EquipmentTag | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);

  const exercises = useLiveQuery(
    () =>
      listExercises({
        search: search || undefined,
        muscleGroup: muscleGroup || undefined,
        equipment: equipment || undefined,
      }),
    [search, muscleGroup, equipment],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Exercise catalog</h1>
        <Button variant="secondary" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Close' : '+ Add'}
        </Button>
      </div>

      {showAddForm && <AddCustomExerciseForm onDone={() => setShowAddForm(false)} />}

      <input
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
      />

      <div className="flex gap-2">
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-sm text-white"
        >
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as EquipmentTag | '')}
          className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-sm text-white"
        >
          <option value="">All equipment</option>
          {EQUIPMENT_CATALOG.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="flex flex-col divide-y divide-slate-800">
        {exercises?.map((ex) => (
          <li key={ex.id}>
            <Link to={`/catalog/${ex.id}`} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-slate-100">
                {ex.isFavorite && '★ '}
                {ex.name}
              </span>
              <span className="text-xs text-slate-500 capitalize">{ex.muscleGroup}</span>
            </Link>
          </li>
        ))}
        {exercises?.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">No exercises match.</li>
        )}
      </ul>
    </div>
  );
}
