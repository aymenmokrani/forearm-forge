import { describe, expect, it } from 'vitest';
import { generateProgram } from './generator';
import type { Profile, Session } from './types';
import { finishWorkout, logSet, sessionStats, startWorkout, suggestSet, undoLastSet } from './workout';

const profile: Profile = {
  equipment: ['bodyweight', 'dumbbell', 'pullup-bar'],
  goal: 'hypertrophy',
  experience: 'intermediate',
  daysPerWeek: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
};
const program = generateProgram(profile);
const t0 = new Date('2026-03-01T10:00:00.000Z');
const t1 = new Date('2026-03-01T10:25:00.000Z');

describe('workout lifecycle', () => {
  it('snapshots the planned day and starts at the first exercise', () => {
    const a = startWorkout(program, 1, t0);
    expect(a.dayIndex).toBe(1);
    expect(a.plan).toEqual(program.days[1]!.exercises);
    expect(a.entries.every((e) => e.sets.length === 0)).toBe(true);
    expect(a.cursor).toBe(0);
  });

  it('logs and undoes sets immutably', () => {
    const a = startWorkout(program, 0, t0);
    const b = logSet(a, 0, { reps: 12, weight: 10 });
    expect(a.entries[0]!.sets).toHaveLength(0);
    expect(b.entries[0]!.sets).toEqual([{ reps: 12, weight: 10 }]);
    expect(undoLastSet(b, 0).entries[0]!.sets).toEqual([]);
  });

  it('drops empty exercises on finish and returns null for an empty workout', () => {
    const a = startWorkout(program, 0, t0);
    expect(finishWorkout(a, t1)).toBeNull();
    const s = finishWorkout(logSet(a, 2, { reps: 10 }), t1, true)!;
    expect(s.entries).toHaveLength(1);
    expect(s.endedForPain).toBe(true);
    expect(sessionStats(s).durationSec).toBe(25 * 60);
  });
});

describe('paused workouts', () => {
  it('ends a long-paused workout at its last set', () => {
    const a = logSet(startWorkout(program, 0, t0), 0, { reps: 10 }, new Date('2026-03-01T10:10:00.000Z'));
    const nextDay = new Date('2026-03-02T09:00:00.000Z');
    const s = finishWorkout(a, nextDay)!;
    expect(s.finishedAt).toBe('2026-03-01T10:10:00.000Z');
    expect(sessionStats(s).durationSec).toBe(600);
  });

  it('keeps the real end time for a normal workout', () => {
    const a = logSet(startWorkout(program, 0, t0), 0, { reps: 10 }, new Date('2026-03-01T10:20:00.000Z'));
    expect(finishWorkout(a, t1)!.finishedAt).toBe(t1.toISOString());
  });
});

describe('suggestSet', () => {
  const planned = { exerciseId: 'db-wrist-curl', sets: 3, reps: 12, restSec: 75 };
  const hold = { exerciseId: 'dead-hang', sets: 3, holdSec: 30, restSec: 75 };
  const history: Session[] = [
    {
      id: 'h',
      dayIndex: 0,
      startedAt: '2026-02-01T00:00:00.000Z',
      finishedAt: '2026-02-01T00:20:00.000Z',
      entries: [
        { exerciseId: 'db-wrist-curl', sets: [{ reps: 12, weight: 10 }, { reps: 10, weight: 10 }] },
        { exerciseId: 'dead-hang', sets: [{ seconds: 35 }] },
      ],
    },
  ];

  it('falls back to the plan target with no history', () => {
    expect(suggestSet(planned, [], [])).toEqual({ reps: 12, seconds: undefined, weight: undefined });
    expect(suggestSet(hold, [], []).seconds).toBe(30);
  });

  it('uses the matching set from last time', () => {
    expect(suggestSet(planned, [], history)).toMatchObject({ reps: 12, weight: 10 });
    expect(suggestSet(planned, [{ reps: 12, weight: 10 }], [])).toMatchObject({ reps: 12, weight: 10 });
    expect(suggestSet(hold, [], history).seconds).toBe(35);
  });
});

describe('sessionStats', () => {
  it('sums sets, volume and hold time', () => {
    const s: Session = {
      id: 'x',
      dayIndex: 0,
      startedAt: t0.toISOString(),
      finishedAt: t1.toISOString(),
      entries: [
        { exerciseId: 'a', sets: [{ reps: 10, weight: 10 }, { reps: 8, weight: 12 }] },
        { exerciseId: 'b', sets: [{ seconds: 30 }] },
      ],
    };
    expect(sessionStats(s)).toEqual({ sets: 3, volume: 196, holdSec: 30, durationSec: 1500 });
  });
});
