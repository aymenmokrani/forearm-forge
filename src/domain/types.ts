export const EQUIPMENT = [
  'bodyweight',
  'gripper',
  'dumbbell',
  'barbell',
  'kettlebell',
  'plate',
  'wrist-roller',
  'band',
  'rice-bucket',
  'towel',
  'pullup-bar',
  'fat-grip',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const TARGETS = [
  'crush-grip',
  'support-grip',
  'pinch-grip',
  'wrist-flexors',
  'wrist-extensors',
  'brachioradialis',
  'pronation-supination',
  'finger-extensors',
] as const;
export type Target = (typeof TARGETS)[number];

export const GOALS = ['strength', 'hypertrophy', 'endurance', 'wrist-health', 'climbing'] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const;
export type Experience = (typeof EXPERIENCE)[number];

export type Units = 'kg' | 'lb';

export interface Exercise {
  id: string;
  name: string;
  /** All listed equipment is required. */
  equipment: Equipment[];
  /** First target is the primary one. */
  targets: Target[];
  type: 'reps' | 'hold';
  difficulty: 1 | 2 | 3;
  cue: string;
  /** Some movements have a natural rep ceiling (e.g. a full wrist-roller length). */
  maxReps?: number;
}

export interface Profile {
  equipment: Equipment[];
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  createdAt: string;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  reps?: number;
  holdSec?: number;
  restSec: number;
}

export interface PlannedDay {
  index: number;
  focus: Target[];
  exercises: PlannedExercise[];
}

export interface Program {
  goal: Goal;
  days: PlannedDay[];
  generatedAt: string;
}

export const GRIPPER_IDS = ['sport', 'trainer', 'p5', 'no1', 'no1.5', 'no2', 'no2.5', 'no3', 'no3.5', 'no4'] as const;
export type GripperId = (typeof GRIPPER_IDS)[number];

/** How a gripper set went: handles touched, nearly, or not at all. */
export const CLOSES = ['full', 'almost', 'no'] as const;
export type Close = (typeof CLOSES)[number];

export interface LoggedSet {
  reps?: number;
  /** Always stored in kg. */
  weight?: number;
  seconds?: number;
  /** Gripper sets only: which gripper and whether it closed. */
  gripper?: GripperId;
  close?: Close;
}

export interface SessionEntry {
  exerciseId: string;
  sets: LoggedSet[];
}

export interface Session {
  id: string;
  dayIndex: number;
  startedAt: string;
  finishedAt: string;
  entries: SessionEntry[];
  endedForPain?: boolean;
}

/** A workout in progress, persisted so a reload resumes it. */
export interface ActiveSession {
  id: string;
  dayIndex: number;
  startedAt: string;
  /** When the most recent set was logged; used to ignore long pauses in the duration. */
  lastSetAt?: string;
  /** Snapshot of the planned day, so regenerating the program can't break a live workout. */
  plan: PlannedExercise[];
  entries: SessionEntry[];
  cursor: number;
}

/** Forearm circumference, always in cm. */
export interface Measurement {
  at: string;
  left: number;
  right: number;
}

export interface AppData {
  schemaVersion: 1;
  profile: Profile | null;
  program: Program | null;
  sessions: Session[];
  active: ActiveSession | null;
  units: Units;
  disclaimerAccepted: boolean;
  measurements: Measurement[];
  /** Day ("YYYY-MM-DD", local) the forearm prompt was dismissed with "Not today". */
  measureSkippedOn?: string;
  /** Timer ticks and workout sounds are on unless this is true. */
  soundOff?: boolean;
}
