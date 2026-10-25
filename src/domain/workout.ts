import { lastSets } from './prs';
import type { ActiveSession, LoggedSet, PlannedExercise, Program, Session } from './types';

export function newId(now: Date): string {
  return `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function startWorkout(program: Program, dayIndex: number, now = new Date()): ActiveSession {
  const day = program.days[dayIndex] ?? program.days[0]!;
  return {
    id: newId(now),
    dayIndex: day.index,
    startedAt: now.toISOString(),
    plan: day.exercises.map((p) => ({ ...p })),
    entries: day.exercises.map((p) => ({ exerciseId: p.exerciseId, sets: [] })),
    cursor: 0,
  };
}

export function logSet(active: ActiveSession, exerciseIndex: number, set: LoggedSet, now = new Date()): ActiveSession {
  return {
    ...active,
    lastSetAt: now.toISOString(),
    entries: active.entries.map((e, i) => (i === exerciseIndex ? { ...e, sets: [...e.sets, set] } : e)),
  };
}

/** A gap this long since the last set means the workout was paused, not trained through. */
export const STALE_AFTER_MS = 30 * 60_000;

export function isStale(active: ActiveSession, now = new Date()): boolean {
  return now.getTime() - Date.parse(active.lastSetAt ?? active.startedAt) > STALE_AFTER_MS;
}

export function undoLastSet(active: ActiveSession, exerciseIndex: number): ActiveSession {
  return {
    ...active,
    entries: active.entries.map((e, i) => (i === exerciseIndex ? { ...e, sets: e.sets.slice(0, -1) } : e)),
  };
}

/**
 * Turns a workout into a saved session. Returns null if nothing was logged.
 * If it was paused and finished much later, it ends at the last logged set
 * so an overnight pause doesn't become a 14-hour workout.
 */
export function finishWorkout(active: ActiveSession, now = new Date(), endedForPain = false): Session | null {
  const entries = active.entries.filter((e) => e.sets.length > 0);
  if (entries.length === 0) return null;
  const end = isStale(active, now) && active.lastSetAt ? new Date(active.lastSetAt) : now;
  return {
    id: active.id,
    dayIndex: active.dayIndex,
    startedAt: active.startedAt,
    finishedAt: end.toISOString(),
    entries,
    ...(endedForPain ? { endedForPain: true } : {}),
  };
}

/**
 * Values to prefill for the next set: this session's previous set, else the same
 * set from last time, else the plan target.
 */
export function suggestSet(planned: PlannedExercise, done: LoggedSet[], history: Session[]): LoggedSet {
  const prev = done[done.length - 1];
  if (prev) return { ...prev };
  const last = lastSets(history, planned.exerciseId);
  const fromLast = last?.[done.length] ?? last?.[last.length - 1];
  return {
    reps: fromLast?.reps ?? planned.reps,
    seconds: planned.holdSec !== undefined ? (fromLast?.seconds ?? planned.holdSec) : undefined,
    weight: fromLast?.weight,
  };
}

export function sessionStats(session: Session) {
  let sets = 0;
  let volume = 0;
  let holdSec = 0;
  for (const e of session.entries) {
    for (const s of e.sets) {
      sets++;
      volume += (s.weight ?? 0) * (s.reps ?? 0);
      holdSec += s.seconds ?? 0;
    }
  }
  const durationSec = Math.max(0, (Date.parse(session.finishedAt) - Date.parse(session.startedAt)) / 1000);
  return { sets, volume, holdSec, durationSec };
}
