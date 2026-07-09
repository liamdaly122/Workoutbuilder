import type { DayDefinition, ExerciseSlot, ProgramTemplate } from '../types';

let slotCounter = 0;
function slot(partial: Omit<ExerciseSlot, 'slotId'>): ExerciseSlot {
  slotCounter += 1;
  return { slotId: `slot-${slotCounter}`, ...partial };
}

function day(dayIndex: number, label: string, slots: ExerciseSlot[]): DayDefinition {
  return { dayIndex, label, slots };
}

const FULL_BODY_3X: ProgramTemplate = {
  id: 'full_body_3x',
  name: 'Full Body (3x/week)',
  description:
    'Every session trains a squat, push, and pull pattern. Great starting point for any equipment level.',
  daysPerWeek: 3,
  splitType: 'full_body',
  requiredAnyEquipmentTags: [],
  dayDefinitions: [
    day(0, 'Full Body A', [
      slot({ movementPattern: 'squat', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'core', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
    day(1, 'Full Body B', [
      slot({ movementPattern: 'hinge', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'core', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
    day(2, 'Full Body C', [
      slot({ movementPattern: 'lunge', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'carry', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
  ],
};

const UPPER_LOWER_4X: ProgramTemplate = {
  id: 'upper_lower_4x',
  name: 'Upper / Lower (4x/week)',
  description: 'Two upper-body and two lower-body sessions per week, with more volume per pattern.',
  daysPerWeek: 4,
  splitType: 'upper_lower',
  requiredAnyEquipmentTags: ['barbell', 'dumbbell', 'machine', 'cable_machine', 'kettlebell'],
  dayDefinitions: [
    day(0, 'Upper A', [
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
      slot({ movementPattern: 'pull', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
    day(1, 'Lower A', [
      slot({ movementPattern: 'squat', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'hinge', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'lunge', role: 'accessory', bodyRegion: 'lower', setCountBase: 2 }),
      slot({ movementPattern: 'core', role: 'accessory', bodyRegion: 'lower', setCountBase: 2 }),
    ]),
    day(2, 'Upper B', [
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
      slot({ movementPattern: 'pull', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
    day(3, 'Lower B', [
      slot({ movementPattern: 'hinge', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'squat', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'lunge', role: 'accessory', bodyRegion: 'lower', setCountBase: 2 }),
      slot({ movementPattern: 'carry', role: 'accessory', bodyRegion: 'lower', setCountBase: 1 }),
    ]),
  ],
};

const PUSH_PULL_LEGS_3X: ProgramTemplate = {
  id: 'push_pull_legs_3x',
  name: 'Push / Pull / Legs (3x/week)',
  description: 'One push day, one pull day, one legs day each week - a classic bodybuilding split.',
  daysPerWeek: 3,
  splitType: 'push_pull_legs',
  requiredAnyEquipmentTags: ['barbell', 'dumbbell', 'machine', 'cable_machine', 'kettlebell'],
  dayDefinitions: [
    day(0, 'Push', [
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'push', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
      slot({ movementPattern: 'core', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
    day(1, 'Pull', [
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'main', bodyRegion: 'upper', setCountBase: 3 }),
      slot({ movementPattern: 'pull', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
      slot({ movementPattern: 'core', role: 'accessory', bodyRegion: 'upper', setCountBase: 2 }),
    ]),
    day(2, 'Legs', [
      slot({ movementPattern: 'squat', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'hinge', role: 'main', bodyRegion: 'lower', setCountBase: 3 }),
      slot({ movementPattern: 'lunge', role: 'accessory', bodyRegion: 'lower', setCountBase: 2 }),
      slot({ movementPattern: 'core', role: 'accessory', bodyRegion: 'lower', setCountBase: 2 }),
    ]),
  ],
};

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  FULL_BODY_3X,
  UPPER_LOWER_4X,
  PUSH_PULL_LEGS_3X,
];

export function getProgramTemplate(id: string): ProgramTemplate {
  const template = PROGRAM_TEMPLATES.find((t) => t.id === id);
  if (!template) throw new Error(`Unknown program template: ${id}`);
  return template;
}

export function eligibleTemplates(availableTags: ReadonlySet<string>): ProgramTemplate[] {
  return PROGRAM_TEMPLATES.filter(
    (t) =>
      t.requiredAnyEquipmentTags.length === 0 ||
      t.requiredAnyEquipmentTags.some((tag) => availableTags.has(tag)),
  );
}
