import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { EquipmentTag, Exercise, ProgramTemplate, TrainingGoal } from '../../domain/types';
import { DEFAULT_PROGRESSION_RULES } from '../../domain/types';
import { eligibleTemplates } from '../../domain/program/templates';
import {
  mainLiftSlotsNeedingBaseline,
  resolveExercisesForTemplate,
} from '../../domain/program/generateMesocycle';
import { listExercises } from '../../data/repositories/exerciseRepo';
import { getAvailableEquipmentTags } from '../../data/repositories/equipmentRepo';
import { updateSettings } from '../../data/repositories/settingsRepo';
import { createMesocycle } from '../../data/repositories/mesocycleRepo';
import { Button } from '../../components/Button';

const DEFAULT_STARTING_WEIGHT: Record<EquipmentTag, number> = {
  barbell: 20,
  dumbbell: 10,
  kettlebell: 16,
  cable_machine: 20,
  machine: 20,
  ez_bar: 10,
  medicine_ball: 5,
  resistance_band: 0,
  bodyweight: 0,
  pull_up_bar: 0,
  exercise_ball: 0,
  other: 10,
};

interface Props {
  goal: TrainingGoal;
  onBack: () => void;
}

export function ReviewStep({ goal, onBack }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [allExercises, setAllExercises] = useState<Exercise[] | null>(null);
  const [availableTags, setAvailableTags] = useState<Set<EquipmentTag> | null>(null);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [exercises, tags] = await Promise.all([listExercises(), getAvailableEquipmentTags()]);
      setAllExercises(exercises);
      setAvailableTags(tags);
      const eligible = eligibleTemplates(tags);
      setTemplates(eligible);
      setTemplateId(eligible[0]?.id ?? '');
    })();
  }, []);

  const template = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId]);

  const resolved = useMemo(() => {
    if (!template || !allExercises || !availableTags) return null;
    return resolveExercisesForTemplate(template, allExercises, availableTags);
  }, [template, allExercises, availableTags]);

  const baselineNeeded = useMemo(() => {
    if (!template || !resolved) return [];
    return mainLiftSlotsNeedingBaseline(template, resolved);
  }, [template, resolved]);

  useEffect(() => {
    if (baselineNeeded.length === 0) return;
    setWeights((prev) => {
      const next = { ...prev };
      for (const { exercise } of baselineNeeded) {
        if (next[exercise.id] === undefined) {
          next[exercise.id] = DEFAULT_STARTING_WEIGHT[exercise.equipment] ?? 10;
        }
      }
      return next;
    });
  }, [baselineNeeded]);

  async function handleConfirm() {
    if (!template || !allExercises || !availableTags) return;
    setSubmitting(true);
    try {
      await updateSettings({ goal, onboardingCompleted: true });
      await createMesocycle({
        template,
        exercises: allExercises,
        availableTags,
        goal,
        baselineWeights: weights,
        progressionSettings: DEFAULT_PROGRESSION_RULES,
        cycleNumber: 1,
        startDate: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      await queryClient.invalidateQueries({ queryKey: ['mesocycle'] });
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (!template || !resolved) {
    return <p className="text-sm text-slate-400">Loading your plan…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Review your plan</h1>
        <p className="mt-1 text-sm text-slate-400">
          A 5-week block: 4 weeks building up, then a lighter deload week.
        </p>
      </div>

      {templates.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-wide text-slate-400 uppercase">Split</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">{template.description}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Your sessions</h2>
        {template.dayDefinitions.map((day) => (
          <div key={day.dayIndex} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="mb-1 text-sm font-medium text-white">{day.label}</div>
            <ul className="flex flex-col gap-0.5 text-sm text-slate-400">
              {day.slots.map((slot) => {
                const exercise = resolved.get(slot.slotId);
                return (
                  <li key={slot.slotId}>
                    {exercise ? exercise.name : `No ${slot.movementPattern} exercise available`}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {baselineNeeded.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-slate-300">Starting weights (kg)</h2>
          <p className="text-xs text-slate-500">
            A conservative guess is fine - the app adjusts this every week based on what you actually lift.
          </p>
          {baselineNeeded.map(({ exercise }) => (
            <div key={exercise.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-200">{exercise.name}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={2.5}
                value={weights[exercise.id] ?? 0}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [exercise.id]: Number(e.target.value) }))
                }
                className="w-20 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-right text-sm text-white"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={onBack} className="flex-1" disabled={submitting}>
          Back
        </Button>
        <Button onClick={handleConfirm} className="flex-1" disabled={submitting}>
          {submitting ? 'Building plan…' : 'Start my plan'}
        </Button>
      </div>
    </div>
  );
}
