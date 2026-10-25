# ForearmForge — SDD v0.1

All-in-one forearm training app: pick the equipment you own (gripper, dumbbells, wrist roller,
bands, rice bucket, towel, pull-up bar, or nothing at all) and a goal (strength, size, endurance,
wrist health, climbing), get a weekly plan, run guided workouts, and track progress.

## Locked decisions
- Mobile-first web app: React 18 + Vite + TypeScript (strict). Installable PWA, fully offline.
- No backend, no auth, single user. Persistence = versioned JSON in localStorage (`schemaVersion`).
- Domain logic (plan generator, PR detection, storage) is pure TS in `src/domain`, unit-tested with Vitest.
- Units kg/lb. Dark-first "gym logbook meets instrument panel" design (see Design).

## Data model
- **Equipment**: gripper, dumbbell, barbell, kettlebell, plate, wrist-roller, band, rice-bucket, towel, pullup-bar, fat-grip, bodyweight (always owned).
- **Goal**: strength | hypertrophy | endurance | wrist-health | climbing.
- **Exercise** (static seeded library, 43 items): id, name, equipment[] (all required), targets[] (first is primary), type `reps`|`hold`, difficulty 1-3, cue, optional maxReps. "Loaded" is derived from equipment.
- **Profile**: equipment[], goal, experience, daysPerWeek (2-5), units, createdAt.
- **Program**: generated from profile — days[] of PlannedExercise {exerciseId, sets, reps|holdSec, restSec}.
- **Session**: id, date, dayIndex, entries[] {exerciseId, sets[] {reps?, weight?, seconds?, done}}, durationSec.
- **PR** (derived): per exercise best weight, reps, hold.

## Programming rules (per goal)
| Goal | Sets | Reps / hold | Rest | Freq |
|---|---|---|---|---|
| strength | 4 | 4-6 reps / 7-10 s holds | 150 s | 2-3x |
| hypertrophy | 3 | 10-15 reps / 30 s holds | 75 s | 2-4x |
| endurance | 3 | 20-30 reps / 45-60 s holds | 45 s | 3-4x |
| wrist-health | 2 | 15 reps slow / 20-30 s holds | 45 s | 3-5x |
| climbing | 5 | 10 s hangs / 6-8 reps | 120 s | 2-3x |

Generator: filter library by owned equipment → rotate across target qualities (crush, support,
pinch, flexors, extensors, rotation) so each day is balanced → 4-5 exercises/day → apply goal template.
Never prescribes unowned equipment; always balances flexors with extensors.

## Features (MVP)
1. Onboarding (equipment multi-select, goal, experience, days/week, safety disclaimer).
2. Generated weekly plan + Today screen.
3. Guided workout player: cues, set logging (reps/weight/seconds) prefilled from last session, hold countdown, rest timer, wake lock.
4. History list + session detail, delete.
5. PR detection + finish summary.
6. Exercise library with equipment/target filters.
7. Settings: units, edit profile → regenerate plan, export/import JSON, reset.
8. PWA offline.

v2: progress charts, forearm circumference tracking, gripper ladder (CoC-style), streaks, warm-up/desk-break routines, auto-progression, 4-week program with deload, custom exercises, quick single-tool sessions.

## Design
Background #0E0F11, surface #17191C, text #F2F0EA, muted #8B8F94, accent forged orange #FF5A1F,
timers/success teal #3FD0C9, PR gold #F5C542. Barlow Condensed headings/numerals, Inter body,
tabular numerals. Bottom tab bar (Today, Plan, Library, History, Me). 48px+ tap targets, huge numerals in player,
respect prefers-reduced-motion. No emoji-as-icons, no purple gradients.

## Safety
First-run disclaimer, per-exercise cue, "stop if sharp pain" prompt in player, conservative defaults.
