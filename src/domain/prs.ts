import type { LoggedSet, Session } from './types';

export interface Bests {
  maxWeight?: number;
  maxReps?: number;
  maxSeconds?: number;
}

export type PRKind = 'weight' | 'hold' | 'reps';

export interface PR {
  exerciseId: string;
  kind: PRKind;
  value: number;
  previous: number;
}

const max = (a: number | undefined, b: number | undefined) =>
  a === undefined ? b : b === undefined ? a : Math.max(a, b);

function setBests(sets: LoggedSet[]): Bests {
  const out: Bests = {};
  for (const s of sets) {
    if (s.weight && s.weight > 0) out.maxWeight = max(out.maxWeight, s.weight);
    if (s.reps && s.reps > 0) out.maxReps = max(out.maxReps, s.reps);
    if (s.seconds && s.seconds > 0) out.maxSeconds = max(out.maxSeconds, s.seconds);
  }
  return out;
}

/** All-time bests per exercise across the given sessions. */
export function computeBests(sessions: Session[]): Map<string, Bests> {
  const bests = new Map<string, Bests>();
  for (const session of sessions) {
    for (const entry of session.entries) {
      const prev = bests.get(entry.exerciseId) ?? {};
      const cur = setBests(entry.sets);
      bests.set(entry.exerciseId, {
        maxWeight: max(prev.maxWeight, cur.maxWeight),
        maxReps: max(prev.maxReps, cur.maxReps),
        maxSeconds: max(prev.maxSeconds, cur.maxSeconds),
      });
    }
  }
  return bests;
}

/**
 * PRs set by `session` relative to every session that finished before it.
 * The first time an exercise is logged sets a baseline, not a PR.
 * At most one PR per exercise, preferring weight > hold > reps. Reps only
 * count when no load is involved, so heavier-but-fewer reps isn't a "rep PR".
 */
export function detectPRs(allSessions: Session[], session: Session): PR[] {
  const prior = allSessions.filter((s) => s.id !== session.id && s.finishedAt < session.finishedAt);
  const bests = computeBests(prior);
  const prs: PR[] = [];
  for (const entry of session.entries) {
    const before = bests.get(entry.exerciseId);
    if (!before) continue;
    const now = setBests(entry.sets);
    if (now.maxWeight !== undefined && before.maxWeight !== undefined && now.maxWeight > before.maxWeight) {
      prs.push({ exerciseId: entry.exerciseId, kind: 'weight', value: now.maxWeight, previous: before.maxWeight });
    } else if (now.maxSeconds !== undefined && before.maxSeconds !== undefined && now.maxSeconds > before.maxSeconds) {
      prs.push({ exerciseId: entry.exerciseId, kind: 'hold', value: now.maxSeconds, previous: before.maxSeconds });
    } else if (
      now.maxWeight === undefined &&
      before.maxWeight === undefined &&
      now.maxReps !== undefined &&
      before.maxReps !== undefined &&
      now.maxReps > before.maxReps
    ) {
      prs.push({ exerciseId: entry.exerciseId, kind: 'reps', value: now.maxReps, previous: before.maxReps });
    }
  }
  return prs;
}

/** Sets from the most recent session that logged this exercise, for prefilling. */
export function lastSets(sessions: Session[], exerciseId: string): LoggedSet[] | undefined {
  const recent = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  for (const s of recent) {
    const entry = s.entries.find((e) => e.exerciseId === exerciseId && e.sets.length > 0);
    if (entry) return entry.sets;
  }
  return undefined;
}
