import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}
