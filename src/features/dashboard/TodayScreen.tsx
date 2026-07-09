import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { useActiveMesocycle } from '../../hooks/useActiveMesocycle';
import { getSessionExercises, getSessionsForMesocycle } from '../../data/repositories/sessionRepo';
import { getExercisesByIds } from '../../data/repositories/exerciseRepo';
import { getProgramTemplateById } from '../../data/repositories/programRepo';
import { WeekProgress } from '../../components/WeekProgress';
import { Button } from '../../components/Button';
import { useEffect, useState } from 'react';
import type { Exercise, SessionExercise } from '../../domain/types';

export function TodayScreen() {
  const navigate = useNavigate();
  const mesocycle = useActiveMesocycle();

  const sessions = useLiveQuery(
    () => (mesocycle ? getSessionsForMesocycle(mesocycle.id) : undefined),
    [mesocycle?.id],
  );

  const [nextSessionExercises, setNextSessionExercises] = useState<
    Array<{ sessionExercise: SessionExercise; exercise: Exercise }> | null
  >(null);
  const [templateName, setTemplateName] = useState<string>('');

  const nextSession = sessions?.find((s) => s.status === 'planned' || s.status === 'in_progress');
  const completedCount = sessions?.filter((s) => s.status === 'completed' || s.status === 'skipped').length ?? 0;

  useEffect(() => {
    if (mesocycle) getProgramTemplateById(mesocycle.programTemplateId).then((t) => setTemplateName(t?.name ?? ''));
  }, [mesocycle?.programTemplateId]);

  useEffect(() => {
    if (!nextSession) {
      setNextSessionExercises(null);
      return;
    }
    (async () => {
      const sessionExercises = await getSessionExercises(nextSession.id);
      const exerciseMap = await getExercisesByIds(sessionExercises.map((se) => se.exerciseId));
      setNextSessionExercises(
        sessionExercises
          .map((se) => ({ sessionExercise: se, exercise: exerciseMap.get(se.exerciseId) as Exercise }))
          .filter((row) => row.exercise),
      );
    })();
  }, [nextSession?.id]);

  if (mesocycle === undefined || sessions === undefined) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  if (mesocycle === null) {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <h1 className="text-lg font-semibold text-white">No active plan</h1>
        <p className="text-sm text-slate-400">Start a new 5-week block to get going.</p>
        <Button onClick={() => navigate('/plan/new')}>Start a new plan</Button>
      </div>
    );
  }

  const mesocycleFinished = !nextSession && sessions.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Today</h1>
        <p className="text-sm text-slate-400">{templateName} · Cycle {mesocycle.cycleNumber}</p>
      </div>

      <WeekProgress
        weekNumber={nextSession?.weekNumber ?? 5}
        isDeload={(nextSession?.weekNumber ?? 5) === 5}
      />

      {mesocycleFinished ? (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
          <div>
            <div className="font-medium text-emerald-300">Mesocycle complete 🎉</div>
            <p className="mt-1 text-sm text-emerald-200/80">
              You've finished all 5 weeks, including the deload. Review your next cycle's starting weights.
            </p>
          </div>
          <Button onClick={() => navigate('/mesocycle/review')}>Review next cycle</Button>
        </div>
      ) : (
        nextSession && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">{nextSession.label}</span>
              <span className="text-xs text-slate-500">
                {completedCount}/{sessions.length} sessions done
              </span>
            </div>
            <ul className="flex flex-col gap-1 text-sm text-slate-400">
              {nextSessionExercises?.map(({ sessionExercise, exercise }) => (
                <li key={sessionExercise.id}>
                  {exercise.name} · {sessionExercise.targetSets}×
                  {sessionExercise.targetRepRange[0]}-{sessionExercise.targetRepRange[1]}
                  {sessionExercise.targetWeight ? ` @ ${sessionExercise.targetWeight}kg` : ''}
                </li>
              ))}
            </ul>
            <Button onClick={() => navigate(`/log/${nextSession.id}`)}>
              {nextSession.status === 'in_progress' ? 'Continue workout' : 'Start workout'}
            </Button>
          </div>
        )
      )}

      <Link to="/catalog" className="text-center text-sm text-slate-500 underline underline-offset-2">
        Browse exercise catalog
      </Link>
    </div>
  );
}
