import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ensureSeeded } from './data/seed/ingestExercises';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSeeded().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading your workout library…</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;
