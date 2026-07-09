import { useRef, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useEquipmentInventory } from '../../hooks/useEquipmentInventory';
import { setEquipmentAvailability } from '../../data/repositories/equipmentRepo';
import { updateSettings } from '../../data/repositories/settingsRepo';
import { exportDatabaseToFile, importDatabaseFromFile } from '../../data/exportImport';
import { EquipmentGrid } from '../../components/EquipmentGrid';
import { Button } from '../../components/Button';
import type { EquipmentItem, TrainingGoal } from '../../domain/types';

export function SettingsScreen() {
  const settings = useSettings();
  const equipment = useEquipmentInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  async function toggleEquipment(item: EquipmentItem) {
    if (item.id === 'bodyweight') return;
    await setEquipmentAvailability(item.id, !item.available);
  }

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportMessage('');
    try {
      await importDatabaseFromFile(file);
      setImportMessage('Import complete. Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setImportMessage(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed.');
    } finally {
      setImporting(false);
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
          onChange={(e) => updateSettings({ goal: e.target.value as TrainingGoal })}
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
                updateSettings({
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
                updateSettings({
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
                updateSettings({
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
                updateSettings({
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
          onChange={(e) => updateSettings({ oneRepMaxFormula: e.target.value as 'epley' | 'brzycki' })}
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
                updateSettings({
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
                updateSettings({
                  restTimerDefaults: { ...settings.restTimerDefaults, accessorySec: Number(e.target.value) },
                })
              }
              className="w-16 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-right"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-300">Backup</h2>
        <p className="text-xs text-slate-500">
          Your data lives only on this device. Export a backup regularly, especially before clearing
          browser data or switching devices.
        </p>
        <Button variant="secondary" onClick={() => exportDatabaseToFile()}>
          Export backup (.json)
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? 'Importing…' : 'Restore from backup'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
          }}
        />
        {importMessage && <p className="text-xs text-slate-400">{importMessage}</p>}
      </section>
    </div>
  );
}
