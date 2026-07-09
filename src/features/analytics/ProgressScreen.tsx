import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getExerciseIdsWithHistory, getExerciseHistory } from '../../data/repositories/setLogRepo';
import { getExercisesByIds } from '../../data/repositories/exerciseRepo';
import { useSettings } from '../../hooks/useSettings';
import { estimate1RM } from '../../domain/metrics/oneRepMax';
import type { Exercise } from '../../domain/types';
import type { ExerciseHistoryEntry } from '../../data/repositories/setLogRepo';

export function ProgressScreen() {
  const settings = useSettings();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      const ids = await getExerciseIdsWithHistory();
      const map = await getExercisesByIds(ids);
      const list = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
      setExercises(list);
      if (list.length > 0) setSelectedId((current) => current || list[0].id);
    })();
  }, []);

  useEffect(() => {
    if (selectedId) getExerciseHistory(selectedId).then(setHistory);
  }, [selectedId]);

  const chartData = useMemo(() => {
    if (!settings) return [];
    const byDate = new Map<string, { date: string; e1rm: number; volume: number }>();
    for (const entry of history) {
      const day = entry.date.slice(0, 10);
      const e1rm = estimate1RM(entry.weight, entry.reps, settings.oneRepMaxFormula);
      const volume = entry.weight * entry.reps;
      const existing = byDate.get(day);
      if (!existing) {
        byDate.set(day, { date: day, e1rm, volume });
      } else {
        existing.e1rm = Math.max(existing.e1rm, e1rm);
        existing.volume += volume;
      }
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [history, settings]);

  const prs = history.filter((h) => h.isPR).slice(-10).reverse();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">Progress</h1>

      {exercises.length === 0 ? (
        <p className="text-sm text-slate-500">Log a few workouts to see your progress here.</p>
      ) : (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <div>
            <h2 className="mb-2 text-sm font-medium text-slate-300">Estimated 1RM</h2>
            <div className="h-48 rounded-xl border border-slate-800 bg-slate-900 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                  <Line type="monotone" dataKey="e1rm" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-slate-300">Volume per session</h2>
            <div className="h-48 rounded-xl border border-slate-800 bg-slate-900 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                  <Line type="monotone" dataKey="volume" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {prs.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-slate-300">Recent PRs</h2>
              <ul className="flex flex-col gap-1 text-sm text-amber-300">
                {prs.map((pr) => (
                  <li key={pr.setLogId}>
                    {pr.date.slice(0, 10)} · {pr.weight}kg × {pr.reps} ({pr.prType === 'e1rm' ? 'est. 1RM' : 'rep'} PR)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
