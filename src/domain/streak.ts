import type { Session } from './types';

/** Midnight on the Monday of the week containing `d`, local time. */
export function weekStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export interface Streak {
  /** Consecutive weeks that hit the target, counting this week once it is hit. */
  weeks: number;
  /** Days trained so far this week. */
  thisWeek: number;
  target: number;
}

/**
 * Weekly target streak: a week counts when it has at least `target` training days
 * (two workouts on one day count once). Rest days never break it; only a week that
 * ends short of the target does. The current week can only add to the streak.
 */
export function weeklyStreak(sessions: Session[], target: number, now = new Date()): Streak {
  const daysByWeek = new Map<number, Set<string>>();
  for (const s of sessions) {
    const at = new Date(s.finishedAt);
    const week = weekStart(at).getTime();
    const days = daysByWeek.get(week) ?? new Set<string>();
    days.add(dayKey(at));
    daysByWeek.set(week, days);
  }
  const count = (week: Date) => daysByWeek.get(week.getTime())?.size ?? 0;

  const current = weekStart(now);
  const thisWeek = count(current);
  let weeks = 0;
  const week = new Date(current);
  for (let i = 0; i < 520; i++) {
    week.setDate(week.getDate() - 7);
    if (count(week) < target) break;
    weeks++;
  }
  if (thisWeek >= target) weeks++;
  return { weeks, thisWeek, target };
}
