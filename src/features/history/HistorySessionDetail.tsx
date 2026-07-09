import { useEffect, useState } from 'react';
import { getSessionExercises } from '../../data/repositories/sessionRepo';
import { getSetLogsForSessionExercise } from '../../data/repositories/setLogRepo';
import { getExercisesByIds } from '../../data/repositories/exerciseRepo';
import type { Exercise, SessionExercise, SetLog } from '../../domain/types';

export function HistorySessionDetail({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState<
    Array<{ sessionExercise: SessionExercise; exercise?: Exercise; setLogs: SetLog[] }>
  >([]);

  useEffect(() => {
    (async () => {
      const sessionExercises = await getSessionExercises(sessionId);
      const exerciseMap = await getExercisesByIds(sessionExercises.map((se) => se.exerciseId));
      const withLogs = await Promise.all(
        sessionExercises.map(async (se) => ({
          sessionExercise: se,
          exercise: exerciseMap.get(se.exerciseId),
          setLogs: (await getSetLogsForSessionExercise(se.id)).filter((l) => l.completedAt),
        })),
      );
      setRows(withLogs);
    })();
  }, [sessionId]);

  return (
    <div className="flex flex-col gap-2 border-t border-slate-800 px-1 pt-2 pb-1">
      {rows.map(({ sessionExercise, exercise, setLogs }) => (
        <div key={sessionExercise.id} className="text-sm">
          <div className="text-slate-200">{exercise?.name ?? sessionExercise.exerciseId}</div>
          <div className="text-xs text-slate-500">
            {setLogs.length === 0
              ? 'Not logged'
              : setLogs.map((l) => `${l.actualWeight ?? 0}×${l.actualReps ?? 0}`).join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}
