import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveMesocycle } from '../../hooks/useActiveMesocycle';
import {
  createMesocycle,
  markMesocycleCompleted,
  suggestNextCycleBaselines,
} from '../../data/repositories/mesocycleRepo';
import { getProgramTemplate } from '../../domain/program/templates';
import { getExercisesByIds, listExercises } from '../../data/repositories/exerciseRepo';
import { getAvailableEquipmentTags } from '../../data/repositories/equipmentRepo';
import type { Exercise, ProgramTemplate } from '../../domain/types';
import type { NextCycleSuggestion } from '../../domain/program/progression';
import { Button } from '../../components/Button';

const RATIONALE_LABEL: Record<NextCycleSuggestion['rationale'], string> = {
  progressed: 'Hit target - progressing',
  repeated: 'Close - repeating weight',
  regressed: 'Missed target - easing back',
};

export function MesocycleReviewScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mesocycle = useActiveMesocycle();
  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [suggestions, setSuggestions] = useState<NextCycleSuggestion[] | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Map<string, Exercise>>(new Map());
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mesocycle) return;
    setTemplate(getProgramTemplate(mesocycle.programTemplateId));
    (async () => {
      const s = await suggestNextCycleBaselines(mesocycle);
      setSuggestions(s);
      setExerciseMap(await getExercisesByIds(s.map((x) => x.exerciseId)));
      setWeights(Object.fromEntries(s.map((x) => [x.exerciseId, x.suggestedWeight])));
    })();
  }, [mesocycle?.id]);

  async function handleConfirm() {
    if (!mesocycle || !template) return;
    setSubmitting(true);
    try {
      const [exercises, availableTags] = await Promise.all([listExercises(), getAvailableEquipmentTags()]);
      await markMesocycleCompleted(mesocycle.id);
      await createMesocycle({
        template,
        exercises,
        availableTags,
        goal: mesocycle.goal,
        baselineWeights: weights,
        progressionSettings: mesocycle.progressionSettings,
        cycleNumber: mesocycle.cycleNumber + 1,
        startDate: new Date().toISOString(),
        previousMesocycleId: mesocycle.id,
      });
      await queryClient.invalidateQueries({ queryKey: ['mesocycle'] });
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (mesocycle === undefined || suggestions === null) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }
  if (!mesocycle) {
    return <p className="text-sm text-slate-400">No cycle to review.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Next cycle</h1>
        <p className="mt-1 text-sm text-slate-400">
          Based on your week-4 peak sets, here's the starting point for cycle {mesocycle.cycleNumber + 1}.
          Adjust anything before continuing.
        </p>
      </div>

      {suggestions.length === 0 && (
        <p className="text-sm text-slate-500">No loadable main lifts to progress - continuing with the same plan.</p>
      )}

      <div className="flex flex-col gap-2">
        {suggestions.map((s) => {
          const exercise = exerciseMap.get(s.exerciseId);
          return (
            <div key={s.exerciseId} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">{exercise?.name ?? s.exerciseId}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={2.5}
                  value={weights[s.exerciseId] ?? s.suggestedWeight}
                  onChange={(e) =>
                    setWeights((prev) => ({ ...prev, [s.exerciseId]: Number(e.target.value) }))
                  }
                  className="w-20 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right text-sm text-white"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {s.previousWeight}kg → {weights[s.exerciseId] ?? s.suggestedWeight}kg ·{' '}
                {RATIONALE_LABEL[s.rationale]} ({Math.round(s.hitRate * 100)}% of sets hit)
              </p>
            </div>
          );
        })}
      </div>

      <Button onClick={handleConfirm} disabled={submitting || !template}>
        {submitting ? 'Starting next cycle…' : 'Start next 5-week cycle'}
      </Button>
    </div>
  );
}
