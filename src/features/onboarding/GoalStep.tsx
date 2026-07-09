import type { TrainingGoal } from '../../domain/types';
import { Button } from '../../components/Button';

const GOALS: Array<{ id: TrainingGoal; title: string; description: string }> = [
  { id: 'strength', title: 'Strength', description: 'Get stronger: lower reps, heavier weight, longer rest.' },
  { id: 'hypertrophy', title: 'Hypertrophy', description: 'Build muscle: moderate reps, higher volume.' },
  { id: 'endurance', title: 'Endurance', description: 'Muscular endurance and conditioning: higher reps, short rest.' },
  { id: 'general', title: 'General fitness', description: 'A balanced mix of strength and conditioning.' },
];

interface Props {
  value: TrainingGoal;
  onChange: (goal: TrainingGoal) => void;
  onNext: () => void;
}

export function GoalStep({ value, onChange, onNext }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white">What's your goal?</h1>
        <p className="mt-1 text-sm text-slate-400">This sets your rep ranges and intensity each week.</p>
      </div>
      <div className="flex flex-col gap-2">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onChange(goal.id)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              value === goal.id
                ? 'border-sky-500 bg-sky-500/10'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="font-medium text-white">{goal.title}</div>
            <div className="mt-0.5 text-sm text-slate-400">{goal.description}</div>
          </button>
        ))}
      </div>
      <Button onClick={onNext} className="mt-2">
        Continue
      </Button>
    </div>
  );
}
