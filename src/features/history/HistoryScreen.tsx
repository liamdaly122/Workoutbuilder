import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listCompletedSessions } from '../../data/repositories/sessionRepo';
import { HistorySessionDetail } from './HistorySessionDetail';

export function HistoryScreen() {
  const { data: sessions } = useQuery({ queryKey: ['completedSessions'], queryFn: listCompletedSessions });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">History</h1>

      {sessions?.length === 0 && (
        <p className="text-sm text-slate-500">Completed workouts will show up here.</p>
      )}

      <ul className="flex flex-col divide-y divide-slate-800">
        {sessions?.map((session) => (
          <li key={session.id} className="py-1">
            <button
              onClick={() => setExpandedId((id) => (id === session.id ? null : session.id))}
              className="flex w-full items-center justify-between py-2 text-left text-sm"
            >
              <span className="text-slate-100">{session.label}</span>
              <span className="text-xs text-slate-500">
                Week {session.weekNumber} · {session.completedAt?.slice(0, 10)}
                {session.status === 'skipped' ? ' · skipped' : ''}
              </span>
            </button>
            {expandedId === session.id && <HistorySessionDetail sessionId={session.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
