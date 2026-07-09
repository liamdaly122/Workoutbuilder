import { useState } from 'react';
import type { TrainingGoal } from '../../domain/types';
import { GoalStep } from './GoalStep';
import { EquipmentStep } from './EquipmentStep';
import { ReviewStep } from './ReviewStep';

type Step = 'goal' | 'equipment' | 'review';

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState<TrainingGoal>('general');

  return (
    <div className="mx-auto min-h-full max-w-lg px-4 pt-[calc(env(safe-area-inset-top)+2rem)] pb-12">
      {step === 'goal' && (
        <GoalStep value={goal} onChange={setGoal} onNext={() => setStep('equipment')} />
      )}
      {step === 'equipment' && (
        <EquipmentStep onNext={() => setStep('review')} onBack={() => setStep('goal')} />
      )}
      {step === 'review' && <ReviewStep goal={goal} onBack={() => setStep('equipment')} />}
    </div>
  );
}
