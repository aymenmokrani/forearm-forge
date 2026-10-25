import { describe, expect, it } from 'vitest';
import { EXERCISES, getExercise, isAvailable } from './exercises';
import { generateProgram, nextDayIndex } from './generator';
import { GOAL_RULES } from './goals';
import { EQUIPMENT, EXPERIENCE, GOALS, type Equipment, type Profile, type Session } from './types';

const profile = (over: Partial<Profile> = {}): Profile => ({
  equipment: ['bodyweight'],
  goal: 'hypertrophy',
  experience: 'intermediate',
  daysPerWeek: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const KITS: Equipment[][] = [
  ['bodyweight'],
  ['gripper'],
  ['dumbbell'],
  ['pullup-bar', 'towel'],
  ['rice-bucket', 'band'],
  [...EQUIPMENT],
];

describe('exercise library', () => {
  it('has unique ids', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });

  it('offers at least 3 exercises for every equipment type', () => {
    for (const eq of EQUIPMENT) {
      expect(EXERCISES.filter((e) => e.equipment.includes(eq)).length, eq).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('generateProgram', () => {
  it('creates one day per training day', () => {
    expect(generateProgram(profile({ daysPerWeek: 4 })).days).toHaveLength(4);
  });

  it('never prescribes equipment the user does not own', () => {
    for (const kit of KITS) {
      for (const goal of GOALS) {
        for (const experience of EXPERIENCE) {
          const program = generateProgram(profile({ equipment: kit, goal, experience }));
          for (const day of program.days) {
            for (const p of day.exercises) {
              expect(isAvailable(getExercise(p.exerciseId)!, kit), `${p.exerciseId} with ${kit}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('includes extensor or finger-extensor work every day', () => {
    for (const kit of KITS) {
      for (const goal of GOALS) {
        const program = generateProgram(profile({ equipment: kit, goal, experience: 'beginner', daysPerWeek: 5 }));
        for (const day of program.days) {
          const balanced = day.exercises.some((p) =>
            getExercise(p.exerciseId)!.targets.some((t) => t === 'wrist-extensors' || t === 'finger-extensors'),
          );
          expect(balanced, `${goal} ${kit} day ${day.index}`).toBe(true);
        }
      }
    }
  });

  it('has no duplicate exercises within a day', () => {
    const program = generateProgram(profile({ equipment: [...EQUIPMENT], daysPerWeek: 5 }));
    for (const day of program.days) {
      const ids = day.exercises.map((p) => p.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('respects the experience difficulty cap', () => {
    const program = generateProgram(profile({ equipment: [...EQUIPMENT], experience: 'beginner', goal: 'strength' }));
    for (const day of program.days) {
      for (const p of day.exercises) expect(getExercise(p.exerciseId)!.difficulty).toBe(1);
    }
  });

  it('keeps wrist-health plans to the gentlest exercises', () => {
    const program = generateProgram(profile({ equipment: [...EQUIPMENT], experience: 'advanced', goal: 'wrist-health' }));
    for (const day of program.days) {
      for (const p of day.exercises) expect(getExercise(p.exerciseId)!.difficulty).toBe(1);
    }
  });

  it('applies the goal template to reps, holds and rest', () => {
    const rules = GOAL_RULES.strength;
    const program = generateProgram(profile({ equipment: [...EQUIPMENT], goal: 'strength' }));
    for (const day of program.days) {
      for (const p of day.exercises) {
        const ex = getExercise(p.exerciseId)!;
        expect(p.sets).toBe(rules.sets);
        expect(p.restSec).toBe(rules.restSec);
        if (ex.type === 'hold') expect(p.holdSec).toBe(rules.holdSec);
        else expect(p.reps).toBe(Math.min(rules.reps, ex.maxReps ?? Infinity));
      }
    }
  });

  it('gives beginners one fewer set (min 2)', () => {
    const program = generateProgram(profile({ experience: 'beginner', goal: 'hypertrophy' }));
    expect(program.days[0]!.exercises[0]!.sets).toBe(2);
  });

  it('prefers owned equipment over bodyweight-only moves', () => {
    const program = generateProgram(profile({ equipment: ['bodyweight', 'dumbbell'], daysPerWeek: 3 }));
    for (const day of program.days) {
      const bodyweight = day.exercises.filter((p) => getExercise(p.exerciseId)!.equipment.every((e) => e === 'bodyweight'));
      expect(bodyweight.length, `day ${day.index}`).toBeLessThanOrEqual(1);
    }
  });

  it('varies exercises across days when the pool allows', () => {
    const program = generateProgram(profile({ equipment: [...EQUIPMENT], daysPerWeek: 3 }));
    const [a, b] = program.days.map((d) => d.exercises.map((p) => p.exerciseId).join());
    expect(a).not.toBe(b);
  });
});

describe('nextDayIndex', () => {
  const program = generateProgram(profile({ daysPerWeek: 3 }));
  const session = (dayIndex: number, finishedAt: string): Session => ({
    id: finishedAt,
    dayIndex,
    startedAt: finishedAt,
    finishedAt,
    entries: [],
  });

  it('starts at day 0 with no history', () => {
    expect(nextDayIndex(program, [])).toBe(0);
  });

  it('follows the most recent session and wraps', () => {
    expect(nextDayIndex(program, [session(0, '2026-01-01'), session(1, '2026-01-03')])).toBe(2);
    expect(nextDayIndex(program, [session(2, '2026-01-05'), session(1, '2026-01-03')])).toBe(0);
  });
});
