import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { ReviewStep } from '../onboarding/ReviewStep';

export function NewPlanScreen() {
  const navigate = useNavigate();
  const settings = useSettings();

  if (!settings) return null;

  return <ReviewStep goal={settings.goal} onBack={() => navigate('/')} />;
}
