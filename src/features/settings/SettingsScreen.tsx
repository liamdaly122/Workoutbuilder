import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../hooks/useSettings';
import { useEquipmentInventory } from '../../hooks/useEquipmentInventory';
import { setEquipmentAvailability } from '../../data/repositories/equipmentRepo';
import { updateSettings } from '../../data/repositories/settingsRepo';
import { exportMyDataToFile } from '../../data/exportImport';
import { supabase } from '../../data/supabaseClient';
import { EquipmentGrid } from '../../components/EquipmentGrid';
import { Button } from '../../components/Button';
import type { EquipmentItem, Settings, TrainingGoal } from '../../domain/types';

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const settings = useSettings();
  const equipment = useEquipmentInventory();
  const [exporting, setExporting] = useState(false);

  async function toggleEquipment(item: EquipmentItem) {
    if (item.id === 'bodyweight') return;
    await setEquipmentAvailability(item.id, !item.available);
    queryClient.invalidateQueries({ queryKey: ['equipmentInventory'] });
  }

  async function saveSettings(patch: Partial<Settings>) {
    await updateSettings(patch);
    queryClient.invalidateQueries({ queryKey: ['settings'] });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportMyDataToFile();
    } finally {
      setExporting(false);
    }
  }

  if (!settings || !equipment) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-white">Settings</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Training goal</h2>
        <p className="text-xs text-slate-500">Applies to your next generated cycle.</p>
        <select
          value={settings.goal}
          onChange={(e) => saveSettings({ goal: e.target.value as TrainingGoal })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="strength">Strength</option>
          <option value="hypertrophy">Hypertrophy</option>
          <option value="endurance">Endurance</option>
          <option value="general">General fitness</option>
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Equipment</h2>
        <EquipmentGrid items={equipment} onToggle={toggleEquipment} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Progression rules</h2>
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
          <label className="flex items-center justify-between">
            Upper body increment (kg)
            <input
              type="number"
              step={0.25}
              value={settings.progressionRuleSet.upperBodyIncrementKg}
              onChange={(e) =>
                saveSettings({
                  progressionRuleSet: {
                    ...settings.progressionRuleSet,
                    upperBodyIncrementKg: Number(e.target.value),
                  },
                })
              }
              className="w-20 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
          <label className="flex items-center justify-between">
            Lower body increment (kg)
            <input
              type="number"
              step={0.25}
              value={settings.progressionRuleSet.lowerBodyIncrementKg}
              onChange={(e) =>
                saveSettings({
                  progressionRuleSet: {
                    ...settings.progressionRuleSet,
                    lowerBodyIncrementKg: Number(e.target.value),
                  },
                })
              }
              className="w-20 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
          <label className="flex items-center justify-between">
            Rounds to nearest (kg)
            <input
              type="number"
              step={0.25}
              value={settings.progressionRuleSet.roundingIncrementKg}
              onChange={(e) =>
                saveSettings({
                  progressionRuleSet: {
                    ...settings.progressionRuleSet,
                    roundingIncrementKg: Number(e.target.value),
                  },
                })
              }
              className="w-20 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
          <label className="flex items-center justify-between">
            Success threshold (% of sets)
            <input
              type="number"
              step={5}
              min={0}
              max={100}
              value={Math.round(settings.progressionRuleSet.successThresholdPct * 100)}
              onChange={(e) =>
                saveSettings({
                  progressionRuleSet: {
                    ...settings.progressionRuleSet,
                    successThresholdPct: Number(e.target.value) / 100,
                  },
                })
              }
              className="w-20 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Estimated 1RM formula</h2>
        <select
          value={settings.oneRepMaxFormula}
          onChange={(e) => saveSettings({ oneRepMaxFormula: e.target.value as 'epley' | 'brzycki' })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="epley">Epley</option>
          <option value="brzycki">Brzycki</option>
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Rest timer defaults (seconds)</h2>
        <div className="flex gap-2">
          <label className="flex flex-1 items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
            Main lifts
            <input
              type="number"
              step={15}
              value={settings.restTimerDefaults.mainSec}
              onChange={(e) =>
                saveSettings({
                  restTimerDefaults: { ...settings.restTimerDefaults, mainSec: Number(e.target.value) },
                })
              }
              className="w-16 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
          <label className="flex flex-1 items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
            Accessories
            <input
              type="number"
              step={15}
              value={settings.restTimerDefaults.accessorySec}
              onChange={(e) =>
                saveSettings({
                  restTimerDefaults: { ...settings.restTimerDefaults, accessorySec: Number(e.target.value) },
                })
              }
              className="w-16 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Your data</h2>
        <p className="text-xs text-slate-500">
          Your data lives in your own Supabase project and follows you across every device you sign into.
          This downloads a personal point-in-time copy as a JSON file, just for peace of mind.
        </p>
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Preparing…' : 'Download my data (.json)'}
        </Button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Account</h2>
        <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
