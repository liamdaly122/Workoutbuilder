import { Navigate, Outlet } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

export function OnboardingGate() {
  const settings = useSettings();

  if (settings === undefined) return null;
  if (!settings.onboardingCompleted) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
