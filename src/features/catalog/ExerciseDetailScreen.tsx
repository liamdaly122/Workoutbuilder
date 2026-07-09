import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../data/db';
import { toggleFavorite, toggleHidden } from '../../data/repositories/exerciseRepo';
import { Button } from '../../components/Button';

export function ExerciseDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const exercise = useLiveQuery(() => (id ? db.exercises.get(id) : undefined), [id]);

  if (exercise === undefined) return <p className="text-sm text-slate-400">Loading…</p>;
  if (!exercise) return <p className="text-sm text-slate-400">Exercise not found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500">
        ← Back
      </button>
      <div>
        <h1 className="text-xl font-semibold text-white">{exercise.name}</h1>
        <p className="mt-1 text-sm text-slate-400 capitalize">
          {exercise.equipment.replace('_', ' ')} · {exercise.movementPattern} · {exercise.muscleGroup}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => toggleFavorite(exercise.id, !exercise.isFavorite)}>
          {exercise.isFavorite ? '★ Favorited' : '☆ Favorite'}
        </Button>
        <Button variant="secondary" onClick={() => toggleHidden(exercise.id, !exercise.isHidden)}>
          {exercise.isHidden ? 'Unhide' : 'Hide from catalog'}
        </Button>
      </div>

      {exercise.primaryMuscles.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-300">Primary muscles</h2>
          <p className="text-sm text-slate-400 capitalize">{exercise.primaryMuscles.join(', ')}</p>
        </div>
      )}

      {exercise.instructions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-300">Instructions</h2>
          <ol className="mt-1 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-slate-400">
            {exercise.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
