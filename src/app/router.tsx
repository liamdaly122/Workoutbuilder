import { createHashRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { AuthGate } from './AuthGate';
import { OnboardingGate } from './OnboardingGate';
import { LoginScreen } from '../features/auth/LoginScreen';
import { OnboardingWizard } from '../features/onboarding/OnboardingWizard';
import { TodayScreen } from '../features/dashboard/TodayScreen';
import { NewPlanScreen } from '../features/dashboard/NewPlanScreen';
import { CatalogScreen } from '../features/catalog/CatalogScreen';
import { ExerciseDetailScreen } from '../features/catalog/ExerciseDetailScreen';
import { LoggerScreen } from '../features/logger/LoggerScreen';
import { ProgressScreen } from '../features/analytics/ProgressScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { MesocycleReviewScreen } from '../features/program/MesocycleReviewScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';

export const router = createHashRouter([
  { path: '/login', element: <LoginScreen /> },
  {
    element: <AuthGate />,
    children: [
      { path: '/onboarding', element: <OnboardingWizard /> },
      {
        element: <OnboardingGate />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <TodayScreen /> },
              { path: '/plan/new', element: <NewPlanScreen /> },
              { path: '/catalog', element: <CatalogScreen /> },
              { path: '/catalog/:id', element: <ExerciseDetailScreen /> },
              { path: '/log/:sessionId', element: <LoggerScreen /> },
              { path: '/progress', element: <ProgressScreen /> },
              { path: '/history', element: <HistoryScreen /> },
              { path: '/mesocycle/review', element: <MesocycleReviewScreen /> },
              { path: '/settings', element: <SettingsScreen /> },
            ],
          },
        ],
      },
    ],
  },
]);
