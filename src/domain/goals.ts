import type { Experience, Goal, Target } from './types';

export interface GoalRules {
  label: string;
  tagline: string;
  sets: number;
  reps: number;
  holdSec: number;
  restSec: number;
  /** Targets each day tries to cover, in order. */
  slots: Target[];
  /** Hardest difficulty this goal ever prescribes. */
  maxDifficulty: 1 | 2 | 3;
  frequency: string;
  effort: string;
  progression: string;
  deload: string;
}

export const GOAL_RULES: Record<Goal, GoalRules> = {
  strength: {
    label: 'Max strength',
    tagline: 'Crush, pinch and hold heavier things.',
    sets: 4,
    reps: 5,
    holdSec: 10,
    restSec: 150,
    slots: ['crush-grip', 'support-grip', 'pinch-grip', 'wrist-flexors', 'wrist-extensors'],
    maxDifficulty: 3,
    frequency: '2-3× per week, 48 h between heavy grip days',
    effort: 'RPE 8-9: leave 1-2 reps in the tank, rarely to failure',
    progression: 'When every set hits the top of the range at RPE ≤ 8, add the smallest jump (1-2.5 kg or the next gripper). Holds: add load once all reach 10 s.',
    deload: 'Every 4-6 weeks, or after 2 stalled sessions: one week at ~50% volume.',
  },
  hypertrophy: {
    label: 'Bigger forearms',
    tagline: 'Volume and pump for size.',
    sets: 3,
    reps: 12,
    holdSec: 30,
    restSec: 75,
    slots: ['wrist-flexors', 'wrist-extensors', 'brachioradialis', 'support-grip', 'pronation-supination'],
    maxDifficulty: 3,
    frequency: '2-4× per week',
    effort: 'RPE 7-9: 1-3 reps in reserve, slow 2-3 s lowering',
    progression: 'Double progression: once every set reaches the top of 8-20 reps, add load and restart at the bottom of the range.',
    deload: 'Every 5-8 weeks: one week at half the sets, same load.',
  },
  endurance: {
    label: 'Endurance',
    tagline: 'Grip that lasts: carries, hangs, long sets.',
    sets: 3,
    reps: 20,
    holdSec: 45,
    restSec: 45,
    slots: ['support-grip', 'crush-grip', 'wrist-flexors', 'wrist-extensors', 'finger-extensors'],
    maxDifficulty: 2,
    frequency: '3-4× per week',
    effort: 'RPE 6-8',
    progression: 'Add 5 s per hold or 2 reps per set each session. At the top of the range, add ~5% load or cut 10 s of rest.',
    deload: 'Every 6-8 weeks: one easy week at ~50% volume.',
  },
  'wrist-health': {
    label: 'Wrist health',
    tagline: 'Bulletproof, pain-free wrists and elbows.',
    sets: 2,
    reps: 15,
    holdSec: 30,
    restSec: 45,
    slots: ['wrist-extensors', 'wrist-flexors', 'pronation-supination', 'finger-extensors'],
    maxDifficulty: 1,
    frequency: '3-5× per week',
    effort: 'RPE 4-6, slow 3 s lowering, isometrics at 50-70% effort',
    progression: 'Add reps first, then the smallest load jumps every 1-2 weeks. Pain must stay ≤ 3/10 and settle by the next morning.',
    deload: 'Not usually needed; back off whenever symptoms flare.',
  },
  climbing: {
    label: 'Climbing',
    tagline: 'Finger strength and hang time.',
    sets: 5,
    reps: 6,
    holdSec: 10,
    restSec: 150,
    slots: ['support-grip', 'pinch-grip', 'crush-grip', 'finger-extensors', 'wrist-extensors'],
    maxDifficulty: 3,
    frequency: '2× per week, never on consecutive days',
    effort: 'RPE 7-8: end each hang with 3-5 s still in reserve',
    progression: 'When every set feels clearly in reserve, add 2-5% bodyweight or remove assistance. Change one variable at a time.',
    deload: 'Every 4-6 weeks: a week of easy climbing or bodyweight hangs only.',
  },
};

export const EXPERIENCE_CAP: Record<Experience, 1 | 2 | 3> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  beginner: 'New to grip training',
  intermediate: 'Trained a few months',
  advanced: 'Trained a year or more',
};

export const WARM_UP: { name: string; seconds: number; cue: string }[] = [
  { name: 'Arm circles & shoulder rolls', seconds: 30, cue: 'Big, easy circles. Get warm.' },
  { name: 'Wrist circles', seconds: 30, cue: '10 each direction, fists loosely closed.' },
  { name: 'Fist clench → finger spread', seconds: 30, cue: 'Brisk pace, building from light to firm.' },
  { name: 'Quadruped wrist rocks', seconds: 40, cue: 'Palms down, then backs of the hands down. Gentle range only.' },
  { name: 'Prayer & reverse-prayer stretch', seconds: 30, cue: '15 s each. Mild tension, never pain.' },
  { name: 'Forearm rotations', seconds: 20, cue: 'Elbows at 90°, slowly palm up, palm down.' },
];

export const SAFETY_FLAGS = [
  'Sharp or stabbing pain, or a pop',
  'Numbness, tingling or pins and needles',
  'Swelling, bruising or sudden loss of grip strength',
  'Pain at night or at rest',
  'Finger pain after hanging or crimping',
];
