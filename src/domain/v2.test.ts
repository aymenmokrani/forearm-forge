import { describe, expect, it } from 'vitest';
import { buildLadder, CLOSES_TO_CLAIM, lastGripper } from './ladder';
import { localDay, measurementDue } from './measure';
import { chartableExercises, exerciseSeries, rangeStart } from './progress';
import { defaultData, parseData } from './storage';
import { weeklyStreak, weekStart } from './streak';
import type { LoggedSet, Session } from './types';

let n = 0;
const session = (finishedAt: string, entries: Record<string, LoggedSet[]> = { 'dead-hang': [{ seconds: 30 }] }): Session => ({
  id: `s${n++}`,
  dayIndex: 0,
  startedAt: finishedAt,
  finishedAt,
  entries: Object.entries(entries).map(([exerciseId, sets]) => ({ exerciseId, sets })),
});

// Wednesday 2026-10-21, local time.
const WED = new Date(2026, 9, 21, 12);
const at = (daysFromWed: number) => new Date(2026, 9, 21 + daysFromWed, 12).toISOString();

describe('weekly streak', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart(WED).getDay()).toBe(1);
    expect(weekStart(WED).getDate()).toBe(19);
  });

  it('counts consecutive full weeks and adds this week only once it is on target', () => {
    // Three full weeks before this one (3 days each), and 2 days so far this week.
    const past = [-7, -6, -5, -14, -13, -12, -21, -20, -19].map((d) => session(at(d)));
    const now = [session(at(-2)), session(at(-1))];
    expect(weeklyStreak([...past, ...now], 3, WED)).toEqual({ weeks: 3, thisWeek: 2, target: 3 });
    expect(weeklyStreak([...past, ...now, session(at(0))], 3, WED).weeks).toBe(4);
  });

  it('breaks on a short week and counts two workouts on one day once', () => {
    const sessions = [session(at(-7)), session(at(-7)), session(at(-6)), ...[-14, -13, -12].map((d) => session(at(d)))];
    expect(weeklyStreak(sessions, 3, WED).weeks).toBe(0);
  });
});

describe('gripper ladder', () => {
  const close = (gripper: LoggedSet['gripper'], c: LoggedSet['close'] = 'full') => ({ 'gripper-crush-reps': [{ reps: 1, gripper, close: c }] });

  it('claims a rung after full closes in 3 separate sessions', () => {
    const two = [session(at(-3), close('p5')), session(at(-2), close('p5'))];
    expect(buildLadder(two).level).toBeNull();
    expect(buildLadder(two).rungs.find((r) => r.id === 'p5')?.sessions).toBe(2);
    const three = [...two, session(at(-1), close('p5'))];
    expect(CLOSES_TO_CLAIM).toBe(3);
    expect(buildLadder(three).level?.id).toBe('p5');
    expect(buildLadder(three).next?.id).toBe('no1');
  });

  it('ignores almost-closes and repeat closes in the same session', () => {
    const s = session(at(-1), { 'gripper-crush-reps': [{ reps: 1, gripper: 'no1', close: 'full' }, { reps: 1, gripper: 'no1', close: 'full' }] });
    const almost = [session(at(-3), close('no1', 'almost')), session(at(-2), close('no1', 'almost'))];
    expect(buildLadder([s, ...almost]).rungs.find((r) => r.id === 'no1')?.sessions).toBe(1);
  });

  it('counts lighter rungs as climbed below the level', () => {
    const ladder = buildLadder([-3, -2, -1].map((d) => session(at(d), close('no1'))));
    expect(ladder.rungs.filter((r) => r.claimed).map((r) => r.id)).toEqual(['sport', 'trainer', 'p5', 'no1']);
  });

  it('remembers the last gripper used', () => {
    expect(lastGripper([session(at(-3), close('trainer')), session(at(-1), close('p5', 'no'))], 'gripper-crush-reps')).toBe('p5');
  });
});

describe('progress chart', () => {
  it('plots the heaviest set per session and marks records after the baseline', () => {
    const sessions = [
      session(at(-14), { 'db-wrist-curl': [{ reps: 12, weight: 5 }, { reps: 10, weight: 6 }] }),
      session(at(-7), { 'db-wrist-curl': [{ reps: 12, weight: 6 }] }),
      session(at(0), { 'db-wrist-curl': [{ reps: 8, weight: 8 }] }),
    ];
    const { metric, points } = exerciseSeries(sessions, 'db-wrist-curl');
    expect(metric).toBe('weight');
    expect(points.map((p) => [p.value, p.record])).toEqual([
      [6, false],
      [6, false],
      [8, true],
    ]);
  });

  it('charts the longest hold for unloaded holds and leaves grippers to the ladder', () => {
    const sessions = [
      session(at(-1), { 'dead-hang': [{ seconds: 30 }, { seconds: 34 }], 'gripper-crush-reps': [{ reps: 5, gripper: 'p5', close: 'full' }] }),
    ];
    expect(exerciseSeries(sessions, 'dead-hang')).toMatchObject({ metric: 'seconds', points: [{ value: 34 }] });
    expect(chartableExercises(sessions)).toEqual(['dead-hang']);
  });

  it('builds range windows in weeks', () => {
    expect(rangeStart('all', WED)).toBeNull();
    expect(rangeStart('4w', WED)?.getDate()).toBe(23);
  });
});

describe('forearm measurements', () => {
  it('is due when never measured, every 2 weeks, and not after "Not today"', () => {
    expect(measurementDue({ measurements: [] }, WED)).toBe(true);
    expect(measurementDue({ measurements: [], measureSkippedOn: localDay(WED) }, WED)).toBe(false);
    expect(measurementDue({ measurements: [{ at: at(-13), left: 31, right: 30.5 }] }, WED)).toBe(false);
    expect(measurementDue({ measurements: [{ at: at(-14), left: 31, right: 30.5 }] }, WED)).toBe(true);
  });

  it('round-trips measurements and gripper sets through storage, dropping bad values', () => {
    const data = {
      ...defaultData(),
      measurements: [{ at: at(0), left: 31.5, right: 31 }, { at: 'nope', left: 31, right: 31 }, { at: at(0), left: 500, right: 31 }],
      measureSkippedOn: '2026-10-21',
      sessions: [session(at(0), { 'gripper-crush-reps': [{ reps: 5, gripper: 'no1', close: 'almost' }] })],
    };
    const parsed = parseData(JSON.stringify(data))!;
    expect(parsed.measurements).toEqual([{ at: at(0), left: 31.5, right: 31 }]);
    expect(parsed.measureSkippedOn).toBe('2026-10-21');
    expect(parsed.sessions[0]!.entries[0]!.sets[0]).toEqual({ reps: 5, gripper: 'no1', close: 'almost' });
    const bad = { ...data, sessions: [session(at(0), { 'gripper-crush-reps': [{ reps: 5, gripper: 'no9' as never }] })] };
    expect(parseData(JSON.stringify(bad))!.sessions).toEqual([]);
  });

  it('keeps the sounds-off setting and defaults to sounds on', () => {
    expect(parseData(JSON.stringify({ ...defaultData(), soundOff: true }))?.soundOff).toBe(true);
    expect(parseData(JSON.stringify(defaultData()))?.soundOff).toBeUndefined();
  });

  it('loads v1 backups that have no measurements', () => {
    const { measurements: _, ...v1 } = defaultData();
    expect(parseData(JSON.stringify(v1))?.measurements).toEqual([]);
  });
});
