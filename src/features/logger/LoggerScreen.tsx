import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  completeSession,
  getSession,
  getSessionExercises,
  isMesocycleFinished,
  startSession,
} from '../../data/repositories/sessionRepo';
import { getExercisesByIds } from '../../data/repositories/exerciseRepo';
import { useSettings } from '../../hooks/useSettings';
import { WeekProgress } from '../../components/WeekProgress';
import { RestTimer } from '../../components/RestTimer';
import { Button } from '../../components/Button';
import { ExerciseLogCard } from './ExerciseLogCard';

export function LoggerScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const settings = useSettings();

  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });
  const { data: sessionExercises } = useQuery({
    queryKey: ['sessionExercises', sessionId],
    queryFn: () => getSessionExercises(sessionId!),
    enabled: !!sessionId,
  });
  const { data: exerciseMap } = useQuery({
    queryKey: ['exercisesByIds', sessionExercises?.map((se) => se.exerciseId)],
    queryFn: () => getExercisesByIds(sessionExercises!.map((se) => se.exerciseId)),
    enabled: !!sessionExercises && sessionExercises.length > 0,
  });

  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (session?.status === 'planned') {
      startSession(session.id).then(() =>
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] }),
      );
    }
  }, [session?.id, session?.status, sessionId, queryClient]);

  const rows = useMemo(
    () => sessionExercises?.map((se) => ({ se, exercise: exerciseMap?.get(se.exerciseId) })) ?? [],
    [sessionExercises, exerciseMap],
  );

  async function handleCompleteSession() {
    if (!session) return;
    setCompleting(true);
    try {
      await completeSession(session.id);
      const finished = await isMesocycleFinished(session.mesocycleId);
      navigate(finished ? '/mesocycle/review' : '/', { replace: true });
    } finally {
      setCompleting(false);
    }
  }

  if (!session || !settings) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-4 pb-16">
      <div>
        <h1 className="text-xl font-semibold text-white">{session.label}</h1>
        <div className="mt-2">
          <WeekProgress weekNumber={session.weekNumber} isDeload={session.weekNumber === 5} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map(
          ({ se, exercise }) =>
            exercise && (
              <ExerciseLogCard
                key={se.id}
                sessionExercise={se}
                exercise={exercise}
                formula={settings.oneRepMaxFormula}
                onSetLogged={(restSeconds) => setRestEndsAt(Date.now() + restSeconds * 1000)}
              />
            ),
        )}
      </div>

      <Button onClick={handleCompleteSession} disabled={completing}>
        {completing ? 'Finishing…' : 'Complete workout'}
      </Button>

      <RestTimer restEndsAt={restEndsAt} onDismiss={() => setRestEndsAt(null)} />
    </div>
  );
}
