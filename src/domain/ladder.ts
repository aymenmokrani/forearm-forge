import type { GripperId, Session } from './types';

export interface Gripper {
  id: GripperId;
  name: string;
  kg: number;
}

/** Common torsion-spring gripper levels, lightest first. */
export const GRIPPERS: Gripper[] = [
  { id: 'sport', name: 'Sport', kg: 36 },
  { id: 'trainer', name: 'Trainer', kg: 45 },
  { id: 'p5', name: 'Point 5', kg: 54 },
  { id: 'no1', name: 'No. 1', kg: 64 },
  { id: 'no1.5', name: 'No. 1.5', kg: 76 },
  { id: 'no2', name: 'No. 2', kg: 88 },
  { id: 'no2.5', name: 'No. 2.5', kg: 104 },
  { id: 'no3', name: 'No. 3', kg: 127 },
  { id: 'no3.5', name: 'No. 3.5', kg: 147 },
  { id: 'no4', name: 'No. 4', kg: 166 },
];

export const getGripper = (id: GripperId) => GRIPPERS.find((g) => g.id === id)!;

/** A rung is claimed after a full close in this many separate sessions. */
export const CLOSES_TO_CLAIM = 3;

/** Exercises where each set records a gripper and whether it closed. */
export const CLOSE_EXERCISES: ReadonlySet<string> = new Set(['gripper-crush-reps']);

export interface Rung extends Gripper {
  /** Separate sessions with at least one full close on this gripper. */
  sessions: number;
  claimed: boolean;
  lastFullAt?: string;
}

export interface Ladder {
  rungs: Rung[];
  /** Heaviest claimed rung. */
  level: Rung | null;
  /** The rung right above the level. */
  next: Rung | null;
}

/**
 * Builds the gripper ladder from logged sets. Claiming a heavier rung also counts
 * every lighter one as climbed, so someone who starts on a No. 1 isn't asked to
 * prove the Sport.
 */
export function buildLadder(sessions: Session[]): Ladder {
  const fullIn = new Map<GripperId, { ids: Set<string>; last?: string }>();
  for (const s of sessions) {
    for (const e of s.entries) {
      for (const set of e.sets) {
        if (!set.gripper || set.close !== 'full') continue;
        const rec = fullIn.get(set.gripper) ?? { ids: new Set<string>() };
        rec.ids.add(s.id);
        if (!rec.last || s.finishedAt > rec.last) rec.last = s.finishedAt;
        fullIn.set(set.gripper, rec);
      }
    }
  }
  const own = GRIPPERS.map((g) => {
    const rec = fullIn.get(g.id);
    return { ...g, sessions: rec?.ids.size ?? 0, lastFullAt: rec?.last, claimed: false };
  });
  let top = -1;
  own.forEach((r, i) => {
    if (r.sessions >= CLOSES_TO_CLAIM) top = i;
  });
  const rungs = own.map((r, i) => ({ ...r, claimed: i <= top }));
  return { rungs, level: rungs[top] ?? null, next: rungs[top + 1] ?? null };
}

/** The gripper last used for this exercise, to preselect it. */
export function lastGripper(sessions: Session[], exerciseId: string): GripperId | undefined {
  const recent = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  for (const s of recent) {
    const sets = s.entries.find((e) => e.exerciseId === exerciseId)?.sets ?? [];
    const g = [...sets].reverse().find((x) => x.gripper)?.gripper;
    if (g) return g;
  }
  return undefined;
}
