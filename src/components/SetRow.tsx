import { useState } from 'react';
import type { SetLog } from '../domain/types';

interface Props {
  setLog: SetLog;
  targetReps: [number, number];
  placeholderWeight?: number | null;
  placeholderReps?: number | null;
  onSave: (data: { actualWeight: number | null; actualReps: number | null }) => void;
}

export function SetRow({ setLog, targetReps, placeholderWeight, placeholderReps, onSave }: Props) {
  const [weight, setWeight] = useState<string>(setLog.actualWeight?.toString() ?? '');
  const [reps, setReps] = useState<string>(setLog.actualReps?.toString() ?? '');

  const isDone = setLog.completedAt !== undefined;

  function handleSave() {
    const w = weight.trim() === '' ? null : Number(weight);
    const r = reps.trim() === '' ? null : Number(reps);
    if (r === null) return;
    onSave({ actualWeight: w, actualReps: r });
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border p-2 ${
        isDone ? 'border-emerald-800 bg-emerald-950/30' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <span className="w-6 text-center text-xs text-slate-500">{setLog.setIndex + 1}</span>
      <input
        type="number"
        inputMode="decimal"
        placeholder={placeholderWeight != null ? String(placeholderWeight) : 'kg'}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-16 rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-center text-sm text-white"
      />
      <span className="text-slate-600">×</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder={placeholderReps != null ? String(placeholderReps) : `${targetReps[0]}-${targetReps[1]}`}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        className="w-14 rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-center text-sm text-white"
      />
      <span className="flex-1 text-center text-xs text-slate-500">
        target {targetReps[0]}-{targetReps[1]}
      </span>
      {setLog.isPR && <span className="text-xs text-amber-400">PR</span>}
      <button
        onClick={handleSave}
        className={`rounded-md px-3 py-1.5 text-sm ${
          isDone ? 'bg-emerald-700 text-white' : 'bg-sky-600 text-white'
        }`}
      >
        {isDone ? '✓' : 'Log'}
      </button>
    </div>
  );
}
