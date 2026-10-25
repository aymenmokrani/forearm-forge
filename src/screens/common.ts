import { startWorkout } from '../domain/workout';
import type { PlannedExercise } from '../domain/types';
import { useNav } from '../state/nav';
import { useStore } from '../state/store';

/** Starts the given plan day (or resumes the workout already in progress) and opens the player. */
export function useBeginWorkout() {
  const { data, update } = useStore();
  const nav = useNav();
  return (dayIndex: number, via: 'go' | 'replace' = 'go') => {
    if (!data.program) return;
    update((d) => (d.program && !d.active ? { ...d, active: startWorkout(d.program, dayIndex) } : d));
    (via === 'go' ? nav.go : nav.replace)({ name: 'player' });
  };
}

export const prescription = (p: PlannedExercise) => `${p.sets} × ${p.holdSec !== undefined ? `${p.holdSec}s` : p.reps}`;

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function daysAgo(iso: string, now = new Date()): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(now) - start(new Date(iso))) / 86_400_000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff} days ago`;
}

/** Monday-start dates of the current week. */
export function currentWeek(now = new Date()): Date[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
