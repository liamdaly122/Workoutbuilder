import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import {
  ensureSetLogsForSessionExercise,
  getLastPerformance,
  getSetLogsForSessionExercise,
  logSet,
} from '../../data/repositories/setLogRepo';
import { listSwapCandidates } from '../../data/repositories/exerciseRepo';
import { getAvailableEquipmentTags } from '../../data/repositories/equipmentRepo';
import { swapSessionExercise } from '../../data/repositories/sessionRepo';
import type { Exercise, SessionExercise } from '../../domain/types';
import type { OneRepMaxFormula } from '../../domain/metrics/oneRepMax';
import { SetRow } from '../../components/SetRow';

interface Props {
  sessionExercise: SessionExercise;
  exercise: Exercise;
  formula: OneRepMaxFormula;
  onSetLogged: (restSeconds: number) => void;
}

export function ExerciseLogCard({ sessionExercise, exercise, formula, onSetLogged }: Props) {
  const [lastPerformance, setLastPerformance] = useState<{ weight: number | null; reps: number | null } | null>(
    null,
  );
  const [swapping, setSwapping] = useState(false);
  const [candidates, setCandidates] = useState<Exercise[]>([]);

  useEffect(() => {
    ensureSetLogsForSessionExercise(sessionExercise);
    getLastPerformance(exercise.id, sessionExercise.id).then(setLastPerformance);
  }, [sessionExercise.id, exercise.id]);

  const setLogs = useLiveQuery(
    () => getSetLogsForSessionExercise(sessionExercise.id),
    [sessionExercise.id],
  );

  async function handleSave(setIndex: number, data: { actualWeight: number | null; actualReps: number | null }) {
    await logSet(sessionExercise.id, setIndex, data, formula);
    onSetLogged(sessionExercise.restSeconds);
  }

  async function openSwapPicker() {
    const availableTags = await getAvailableEquipmentTags();
    const options = await listSwapCandidates(sessionExercise.movementPattern, availableTags, exercise.id);
    setCandidates(options);
    setSwapping(true);
  }

  async function handleSwap(newExerciseId: string) {
    await swapSessionExercise(sessionExercise.id, newExerciseId);
    setSwapping(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-medium text-white">{exercise.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 capitalize">{sessionExercise.role}</span>
          <button onClick={openSwapPicker} className="text-xs text-sky-400 underline underline-offset-2">
            Swap
          </button>
        </div>
      </div>
      {sessionExercise.targetWeight != null && (
        <p className="text-xs text-slate-500">Target: {sessionExercise.targetWeight}kg</p>
      )}

      {swapping && (
        <div className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950 p-2">
          {candidates.length === 0 ? (
            <p className="text-xs text-slate-500">No alternatives with your equipment.</p>
          ) : (
            candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSwap(c.id)}
                className="rounded-md px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {c.name}
              </button>
            ))
          )}
          <button onClick={() => setSwapping(false)} className="text-xs text-slate-500">
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {setLogs?.map((setLog) => (
          <SetRow
            key={setLog.id}
            setLog={setLog}
            targetReps={sessionExercise.targetRepRange}
            placeholderWeight={lastPerformance?.weight ?? sessionExercise.targetWeight}
            placeholderReps={lastPerformance?.reps}
            onSave={(data) => handleSave(setLog.setIndex, data)}
          />
        ))}
      </div>
    </div>
  );
}
