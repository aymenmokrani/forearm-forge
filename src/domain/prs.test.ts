import { describe, expect, it } from 'vitest';
import { computeBests, detectPRs, lastSets } from './prs';
import type { LoggedSet, Session } from './types';

const session = (id: string, finishedAt: string, entries: Record<string, LoggedSet[]>): Session => ({
  id,
  dayIndex: 0,
  startedAt: finishedAt,
  finishedAt,
  entries: Object.entries(entries).map(([exerciseId, sets]) => ({ exerciseId, sets })),
});

describe('detectPRs', () => {
  const s1 = session('s1', '2026-01-01', {
    'db-wrist-curl': [{ reps: 12, weight: 10 }],
    'dead-hang': [{ seconds: 30 }],
    'fist-to-spread': [{ reps: 20 }],
  });

  it('treats the first log of an exercise as a baseline, not a PR', () => {
    expect(detectPRs([s1], s1)).toEqual([]);
  });

  it('detects weight, hold and unloaded rep PRs', () => {
    const s2 = session('s2', '2026-01-03', {
      'db-wrist-curl': [{ reps: 8, weight: 12 }],
      'dead-hang': [{ seconds: 42 }],
      'fist-to-spread': [{ reps: 25 }],
    });
    expect(detectPRs([s1, s2], s2)).toEqual([
      { exerciseId: 'db-wrist-curl', kind: 'weight', value: 12, previous: 10 },
      { exerciseId: 'dead-hang', kind: 'hold', value: 42, previous: 30 },
      { exerciseId: 'fist-to-spread', kind: 'reps', value: 25, previous: 20 },
    ]);
  });

  it('does not count more reps at a loaded exercise as a rep PR', () => {
    const s2 = session('s2', '2026-01-03', { 'db-wrist-curl': [{ reps: 20, weight: 8 }] });
    expect(detectPRs([s1, s2], s2)).toEqual([]);
  });

  it('only compares against earlier sessions', () => {
    const later = session('s3', '2026-02-01', { 'dead-hang': [{ seconds: 90 }] });
    const s2 = session('s2', '2026-01-03', { 'dead-hang': [{ seconds: 40 }] });
    expect(detectPRs([s1, s2, later], s2)).toEqual([{ exerciseId: 'dead-hang', kind: 'hold', value: 40, previous: 30 }]);
  });
});

describe('computeBests / lastSets', () => {
  const a = session('a', '2026-01-01', { 'dead-hang': [{ seconds: 20 }, { seconds: 35 }] });
  const b = session('b', '2026-01-05', { 'dead-hang': [{ seconds: 30 }], 'hammer-curl': [] });

  it('aggregates bests over all sessions', () => {
    expect(computeBests([a, b]).get('dead-hang')?.maxSeconds).toBe(35);
  });

  it('returns the most recent non-empty sets', () => {
    expect(lastSets([a, b], 'dead-hang')).toEqual([{ seconds: 30 }]);
    expect(lastSets([a, b], 'hammer-curl')).toBeUndefined();
  });
});
