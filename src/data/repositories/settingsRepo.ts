import { supabase } from '../supabaseClient';
import type { Settings } from '../../domain/types';

interface SettingsRow {
  unit_system: Settings['unitSystem'];
  goal: Settings['goal'];
  onboarding_completed: boolean;
  rest_timer_main_sec: number;
  rest_timer_accessory_sec: number;
  progression_rule_set: Settings['progressionRuleSet'];
  one_rep_max_formula: Settings['oneRepMaxFormula'];
}

function toDomainSettings(row: SettingsRow): Settings {
  return {
    unitSystem: row.unit_system,
    goal: row.goal,
    onboardingCompleted: row.onboarding_completed,
    restTimerDefaults: { mainSec: row.rest_timer_main_sec, accessorySec: row.rest_timer_accessory_sec },
    progressionRuleSet: row.progression_rule_set,
    oneRepMaxFormula: row.one_rep_max_formula,
  };
}

export async function getSettings(): Promise<Settings> {
  // The `settings` row is auto-created by a database trigger the moment an
  // account is created (see supabase/schema.sql), so it always exists here.
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) throw error;
  return toDomainSettings(data as SettingsRow);
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const row: Partial<SettingsRow> = {};
  if (patch.unitSystem !== undefined) row.unit_system = patch.unitSystem;
  if (patch.goal !== undefined) row.goal = patch.goal;
  if (patch.onboardingCompleted !== undefined) row.onboarding_completed = patch.onboardingCompleted;
  if (patch.restTimerDefaults !== undefined) {
    row.rest_timer_main_sec = patch.restTimerDefaults.mainSec;
    row.rest_timer_accessory_sec = patch.restTimerDefaults.accessorySec;
  }
  if (patch.progressionRuleSet !== undefined) row.progression_rule_set = patch.progressionRuleSet;
  if (patch.oneRepMaxFormula !== undefined) row.one_rep_max_formula = patch.oneRepMaxFormula;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase.from('settings').update(row).eq('user_id', user.id);
  if (error) throw error;
}
