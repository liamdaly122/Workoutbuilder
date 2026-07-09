export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'general';

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push'
  | 'pull'
  | 'carry'
  | 'core'
  | 'other';

export type BodyRegion = 'upper' | 'lower';

export type EquipmentTag =
  | 'bodyweight'
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable_machine'
  | 'machine'
  | 'resistance_band'
  | 'ez_bar'
  | 'medicine_ball'
  | 'exercise_ball'
  | 'pull_up_bar'
  | 'other';

export type UnitSystem = 'kg' | 'lb';

export interface Exercise {
  id: string;
  name: string;
  force: 'push' | 'pull' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: EquipmentTag;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleGroup: string;
  instructions: string[];
  category: string;
  movementPattern: MovementPattern;
  source: 'seed' | 'custom';
  isHidden: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: EquipmentTag;
  label: string;
  available: boolean;
  minLoadKg?: number;
  maxLoadKg?: number;
}

export interface WeekLiftScheme {
  setsMultiplier: number;
  repRange: [number, number];
  intensityPct: number;
}

export interface WeekScheme {
  id: string;
  goal: TrainingGoal;
  weekNumber: 1 | 2 | 3 | 4 | 5;
  isDeload: boolean;
  mainLift: WeekLiftScheme;
  accessory: Omit<WeekLiftScheme, 'intensityPct'>;
  restSecondsMain: number;
  restSecondsAccessory: number;
}

export interface ExerciseSlot {
  slotId: string;
  movementPattern: MovementPattern;
  role: 'main' | 'accessory';
  bodyRegion: BodyRegion;
  preferredEquipment?: EquipmentTag[];
  setCountBase: number;
}

export interface DayDefinition {
  dayIndex: number;
  label: string;
  slots: ExerciseSlot[];
}

export type SplitType = 'full_body' | 'upper_lower' | 'push_pull_legs';

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  splitType: SplitType;
  /** At least one of these tags must be available to select this template (empty = always eligible). */
  requiredAnyEquipmentTags: EquipmentTag[];
  dayDefinitions: DayDefinition[];
}

export interface ProgressionRuleSet {
  upperBodyIncrementKg: number;
  lowerBodyIncrementKg: number;
  roundingIncrementKg: number;
  successThresholdPct: number;
}

export type MesocycleStatus = 'active' | 'completed' | 'abandoned';

export interface Mesocycle {
  id: string;
  programTemplateId: string;
  goal: TrainingGoal;
  cycleNumber: number;
  startDate: string;
  status: MesocycleStatus;
  baselineWeights: Record<string, number>;
  progressionSettings: ProgressionRuleSet;
  previousMesocycleId?: string;
}

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

export interface WorkoutSession {
  id: string;
  mesocycleId: string;
  weekNumber: 1 | 2 | 3 | 4 | 5;
  dayIndex: number;
  label: string;
  status: SessionStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  slotId: string;
  movementPattern: MovementPattern;
  orderIndex: number;
  role: 'main' | 'accessory';
  bodyRegion: BodyRegion;
  targetSets: number;
  targetRepRange: [number, number];
  targetWeight: number | null;
  restSeconds: number;
  swappedFromExerciseId?: string;
}

export interface SetLog {
  id: string;
  sessionExerciseId: string;
  setIndex: number;
  isWarmup: boolean;
  actualReps: number | null;
  actualWeight: number | null;
  rpe?: number | null;
  completedAt?: string;
  isPR?: boolean;
  prType?: 'e1rm' | 'rep';
}

export interface BodyMetric {
  id: string;
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  notes?: string;
}

export interface Settings {
  unitSystem: UnitSystem;
  goal: TrainingGoal;
  onboardingCompleted: boolean;
  restTimerDefaults: { mainSec: number; accessorySec: number };
  progressionRuleSet: ProgressionRuleSet;
  oneRepMaxFormula: 'epley' | 'brzycki';
}

export const DEFAULT_PROGRESSION_RULES: ProgressionRuleSet = {
  upperBodyIncrementKg: 1.25,
  lowerBodyIncrementKg: 2.5,
  roundingIncrementKg: 2.5,
  successThresholdPct: 0.9,
};
