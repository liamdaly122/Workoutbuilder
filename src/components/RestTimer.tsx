import { useEffect, useState } from 'react';

interface Props {
  restEndsAt: number | null;
  onDismiss: () => void;
}

export function RestTimer({ restEndsAt, onDismiss }: Props) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (restEndsAt === null) return;
    const tick = () => setRemainingMs(Math.max(0, restEndsAt - Date.now()));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [restEndsAt]);

  if (restEndsAt === null) return null;

  const seconds = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const done = remainingMs <= 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-lg items-center justify-between px-4 py-3 text-sm font-medium ${
        done ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
      }`}
    >
      <span>{done ? 'Rest complete - go!' : `Rest: ${mm}:${ss.toString().padStart(2, '0')}`}</span>
      <button onClick={onDismiss} className="rounded-md bg-black/20 px-2 py-1 text-xs">
        Dismiss
      </button>
    </div>
  );
}
