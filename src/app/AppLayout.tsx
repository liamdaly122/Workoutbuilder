import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <main className="flex-1 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
