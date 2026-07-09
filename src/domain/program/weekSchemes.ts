import type { TrainingGoal, WeekScheme } from '../types';

interface GoalProfile {
  /** Main-lift rep range and %1RM intensity at week 1 and week 4 (peak); linearly interpolated for weeks 2-3. */
  mainRepsStart: number;
  mainRepsPeak: number;
  intensityStart: number;
  intensityPeak: number;
  setsMultiplierStart: number;
  setsMultiplierPeak: number;
  accessoryRepsStart: [number, number];
  accessoryRepsPeak: [number, number];
  restSecondsMain: number;
  restSecondsAccessory: number;
  /** Deload week 5 targets, as a fraction of week-4 peak values. */
  deloadIntensityFactor: number;
  deloadSetsFactor: number;
}

const GOAL_PROFILES: Record<TrainingGoal, GoalProfile> = {
  strength: {
    mainRepsStart: 6,
    mainRepsPeak: 3,
    intensityStart: 0.7,
    intensityPeak: 0.9,
    setsMultiplierStart: 1.0,
    setsMultiplierPeak: 1.1,
    accessoryRepsStart: [8, 10],
    accessoryRepsPeak: [6, 8],
    restSecondsMain: 150,
    restSecondsAccessory: 90,
    deloadIntensityFactor: 0.55,
    deloadSetsFactor: 0.5,
  },
  hypertrophy: {
    mainRepsStart: 12,
    mainRepsPeak: 8,
    intensityStart: 0.65,
    intensityPeak: 0.78,
    setsMultiplierStart: 1.0,
    setsMultiplierPeak: 1.3,
    accessoryRepsStart: [12, 15],
    accessoryRepsPeak: [8, 12],
    restSecondsMain: 90,
    restSecondsAccessory: 60,
    deloadIntensityFactor: 0.6,
    deloadSetsFactor: 0.5,
  },
  endurance: {
    mainRepsStart: 20,
    mainRepsPeak: 12,
    intensityStart: 0.5,
    intensityPeak: 0.62,
    setsMultiplierStart: 1.0,
    setsMultiplierPeak: 1.2,
    accessoryRepsStart: [15, 20],
    accessoryRepsPeak: [12, 15],
    restSecondsMain: 45,
    restSecondsAccessory: 30,
    deloadIntensityFactor: 0.65,
    deloadSetsFactor: 0.5,
  },
  general: {
    mainRepsStart: 15,
    mainRepsPeak: 8,
    intensityStart: 0.6,
    intensityPeak: 0.72,
    setsMultiplierStart: 1.0,
    setsMultiplierPeak: 1.2,
    accessoryRepsStart: [12, 15],
    accessoryRepsPeak: [8, 12],
    restSecondsMain: 75,
    restSecondsAccessory: 45,
    deloadIntensityFactor: 0.6,
    deloadSetsFactor: 0.5,
  },
};

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function buildWeekSchemesForGoal(goal: TrainingGoal): WeekScheme[] {
  const p = GOAL_PROFILES[goal];
  const weeks: WeekScheme[] = [];

  for (let week = 1; week <= 4; week++) {
    const t = (week - 1) / 3; // 0, 1/3, 2/3, 1 across weeks 1-4
    const mainReps = Math.round(lerp(p.mainRepsStart, p.mainRepsPeak, t));
    const intensityPct = Number(lerp(p.intensityStart, p.intensityPeak, t).toFixed(2));
    const setsMultiplier = Number(lerp(p.setsMultiplierStart, p.setsMultiplierPeak, t).toFixed(2));
    const accessoryLow = Math.round(lerp(p.accessoryRepsStart[0], p.accessoryRepsPeak[0], t));
    const accessoryHigh = Math.round(lerp(p.accessoryRepsStart[1], p.accessoryRepsPeak[1], t));

    weeks.push({
      id: `${goal}-w${week}`,
      goal,
      weekNumber: week as 1 | 2 | 3 | 4,
      isDeload: false,
      mainLift: {
        setsMultiplier,
        repRange: [Math.max(1, mainReps - 2), mainReps + 1],
        intensityPct,
      },
      accessory: {
        setsMultiplier,
        repRange: [accessoryLow, accessoryHigh],
      },
      restSecondsMain: p.restSecondsMain,
      restSecondsAccessory: p.restSecondsAccessory,
    });
  }

  // Week 5: deload, scaled down from the week-4 peak.
  const peakMainReps = p.mainRepsPeak;
  weeks.push({
    id: `${goal}-w5`,
    goal,
    weekNumber: 5,
    isDeload: true,
    mainLift: {
      setsMultiplier: Number((p.setsMultiplierPeak * p.deloadSetsFactor).toFixed(2)),
      repRange: [peakMainReps, peakMainReps + 3],
      intensityPct: Number((p.intensityPeak * p.deloadIntensityFactor).toFixed(2)),
    },
    accessory: {
      setsMultiplier: Number((p.setsMultiplierPeak * p.deloadSetsFactor).toFixed(2)),
      repRange: p.accessoryRepsStart,
    },
    restSecondsMain: Math.round(p.restSecondsMain * 0.75),
    restSecondsAccessory: Math.round(p.restSecondsAccessory * 0.75),
  });

  return weeks;
}

/** All (goal x week) rows, generated from each goal's loading profile rather than hardcoded per-row. */
export const ALL_WEEK_SCHEMES: WeekScheme[] = (
  Object.keys(GOAL_PROFILES) as TrainingGoal[]
).flatMap(buildWeekSchemesForGoal);

export function getWeekScheme(goal: TrainingGoal, weekNumber: 1 | 2 | 3 | 4 | 5): WeekScheme {
  const scheme = ALL_WEEK_SCHEMES.find((w) => w.goal === goal && w.weekNumber === weekNumber);
  if (!scheme) throw new Error(`No WeekScheme for goal=${goal} week=${weekNumber}`);
  return scheme;
}
