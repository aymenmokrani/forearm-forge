import { CLOSE_EXERCISES } from './ladder';
import type { Session } from './types';

export type Range = '4w' | '12w' | 'all';

export const RANGE_LABEL: Record<Range, string> = { '4w': '4W', '12w': '12W', all: 'All' };

/** Start of the window a range covers, or null for all time. */
export function rangeStart(range: Range, now = new Date()): Date | null {
  if (range === 'all') return null;
  const weeks = range === '4w' ? 4 : 12;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - weeks * 7);
}

export const inRange = (s: Session, start: Date | null) => !start || Date.parse(s.finishedAt) >= start.getTime();

/** What the main chart plots: the heaviest set, else the longest hold, else the most reps. */
export type Metric = 'weight' | 'seconds' | 'reps';

export interface Point {
  at: string;
  value: number;
  /** Beat every earlier session. The first session is a baseline, not a record. */
  record: boolean;
}

const sorted = (sessions: Session[]) => [...sessions].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));

export function metricFor(sessions: Session[], exerciseId: string): Metric {
  let seconds = false;
  for (const s of sessions) {
    for (const set of s.entries.find((e) => e.exerciseId === exerciseId)?.sets ?? []) {
      if (set.weight && set.weight > 0) return 'weight';
      if (set.seconds !== undefined) seconds = true;
    }
  }
  return seconds ? 'seconds' : 'reps';
}

/** One point per session that logged the exercise: its best set by the exercise's metric. */
export function exerciseSeries(sessions: Session[], exerciseId: string): { metric: Metric; points: Point[] } {
  const metric = metricFor(sessions, exerciseId);
  const points: Point[] = [];
  let best = -Infinity;
  for (const s of sorted(sessions)) {
    const sets = s.entries.find((e) => e.exerciseId === exerciseId)?.sets ?? [];
    const values = sets.map((x) => x[metric] ?? 0).filter((v) => v > 0);
    if (values.length === 0) continue;
    const value = Math.max(...values);
    points.push({ at: s.finishedAt, value, record: points.length > 0 && value > best });
    best = Math.max(best, value);
  }
  return { metric, points };
}

/** Exercises worth charting, most logged first. Gripper closes live on the ladder instead. */
export function chartableExercises(sessions: Session[]): string[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const e of s.entries) {
      if (e.sets.length === 0 || CLOSE_EXERCISES.has(e.exerciseId)) continue;
      counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id]) => id);
}
