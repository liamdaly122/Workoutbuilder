import Dexie, { type EntityTable } from 'dexie';
import type {
  BodyMetric,
  Exercise,
  EquipmentItem,
  Mesocycle,
  ProgramTemplate,
  Settings,
  SessionExercise,
  SetLog,
  WeekScheme,
  WorkoutSession,
} from '../domain/types';

export class WorkoutDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  equipmentInventory!: EntityTable<EquipmentItem, 'id'>;
  programTemplates!: EntityTable<ProgramTemplate, 'id'>;
  weekSchemes!: EntityTable<WeekScheme, 'id'>;
  mesocycles!: EntityTable<Mesocycle, 'id'>;
  workoutSessions!: EntityTable<WorkoutSession, 'id'>;
  sessionExercises!: EntityTable<SessionExercise, 'id'>;
  setLogs!: EntityTable<SetLog, 'id'>;
  bodyMetrics!: EntityTable<BodyMetric, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('workoutbuilder');
    this.version(1).stores({
      exercises:
        'id, category, mechanic, equipment, movementPattern, muscleGroup, *primaryMuscles, *secondaryMuscles, source, isFavorite',
      equipmentInventory: 'id, available',
      programTemplates: 'id, splitType',
      weekSchemes: 'id, [goal+weekNumber]',
      mesocycles: 'id, programTemplateId, status, cycleNumber',
      workoutSessions: 'id, mesocycleId, [mesocycleId+weekNumber], status',
      sessionExercises: 'id, sessionId, exerciseId',
      setLogs: 'id, sessionExerciseId, completedAt',
      bodyMetrics: 'id, date',
      settings: 'id',
    });
  }
}

export const db = new WorkoutDatabase();
