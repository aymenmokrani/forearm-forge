import { EXERCISES, isAvailable } from './exercises';
import { EXPERIENCE_CAP, GOAL_RULES } from './goals';
import type { Exercise, PlannedDay, PlannedExercise, Profile, Program, Session, Target } from './types';

/** Targets that balance flexor/grip work. Every day must hit at least one. */
const BALANCE: ReadonlySet<Target> = new Set<Target>(['wrist-extensors', 'finger-extensors']);

const isBalancing = (ex: Exercise) => ex.targets.some((t) => BALANCE.has(t));

export function availablePool(profile: Pick<Profile, 'equipment' | 'goal' | 'experience'>): Exercise[] {
  const cap = Math.min(EXPERIENCE_CAP[profile.experience], GOAL_RULES[profile.goal].maxDifficulty);
  return EXERCISES.filter((ex) => ex.difficulty <= cap && isAvailable(ex, profile.equipment));
}

function prescribe(ex: Exercise, profile: Profile): PlannedExercise {
  const rules = GOAL_RULES[profile.goal];
  const sets = profile.experience === 'beginner' ? Math.max(2, rules.sets - 1) : rules.sets;
  const base = { exerciseId: ex.id, sets, restSec: rules.restSec };
  if (ex.type === 'hold') return { ...base, holdSec: rules.holdSec };
  return { ...base, reps: Math.min(rules.reps, ex.maxReps ?? Infinity) };
}

/**
 * Rule-based weekly plan: each day walks the goal's target slots (rotated per day so
 * the emphasis shifts), picking the least-used owned exercise for each slot.
 * Guarantees: only owned equipment, no duplicates within a day, and every day
 * includes extensor / finger-extensor work to balance the gripping.
 */
export function generateProgram(profile: Profile, now = new Date()): Program {
  const rules = GOAL_RULES[profile.goal];
  const pool = availablePool(profile);
  const perDay = profile.experience === 'beginner' || profile.goal === 'wrist-health' ? 4 : 5;
  const ownsGear = profile.equipment.some((e) => e !== 'bodyweight');
  const usage = new Map<string, number>();
  const days: PlannedDay[] = [];

  for (let d = 0; d < profile.daysPerWeek; d++) {
    const offset = d % rules.slots.length;
    const slots = [...rules.slots.slice(offset), ...rules.slots.slice(0, offset)];
    const chosen: Exercise[] = [];
    const rank = (ex: Exercise, slot?: Target) => {
      const primaryMiss = slot && ex.targets[0] !== slot ? 1 : 0;
      // People who list equipment want to use it: a bodyweight move only wins once
      // the equipment options have been repeated well beyond it.
      const bodyweightOnly = ownsGear && ex.equipment.every((e) => e === 'bodyweight') ? 1 : 0;
      const tie = (pool.indexOf(ex) + d * 7) % pool.length;
      return (usage.get(ex.id) ?? 0) * 1000 + bodyweightOnly * 2500 + primaryMiss * 100 + tie;
    };
    const pick = (candidates: Exercise[], slot?: Target) => {
      const best = [...candidates].sort((a, b) => rank(a, slot) - rank(b, slot))[0];
      if (best) {
        chosen.push(best);
        usage.set(best.id, (usage.get(best.id) ?? 0) + 1);
      }
    };
    const unused = () => pool.filter((ex) => !chosen.includes(ex));

    for (const slot of slots) {
      if (chosen.length >= perDay) break;
      pick(unused().filter((ex) => ex.targets.includes(slot)), slot);
    }
    while (chosen.length < perDay && unused().length > 0) pick(unused());

    if (!chosen.some(isBalancing)) {
      const removed = chosen.pop();
      if (removed) usage.set(removed.id, (usage.get(removed.id) ?? 1) - 1);
      pick(unused().filter(isBalancing));
    }

    // Heavy gripping first, balancing work last.
    chosen.sort((a, b) => Number(BALANCE.has(a.targets[0]!)) - Number(BALANCE.has(b.targets[0]!)));

    days.push({
      index: d,
      focus: [...new Set(chosen.map((ex) => ex.targets[0]!))],
      exercises: chosen.map((ex) => prescribe(ex, profile)),
    });
  }

  return { goal: profile.goal, days, generatedAt: now.toISOString() };
}

/** The plan day after the most recently finished one, wrapping around. */
export function nextDayIndex(program: Program, sessions: Session[]): number {
  const last = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
  const n = program.days.length;
  if (!last || n === 0 || !Number.isInteger(last.dayIndex)) return 0;
  return (((last.dayIndex + 1) % n) + n) % n;
}

export const DAY_LETTERS = 'ABCDEFG';
export const dayName = (index: number) => `Day ${DAY_LETTERS[index] ?? index + 1}`;
