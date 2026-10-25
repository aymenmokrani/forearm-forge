# ForearmForge

All-in-one forearm, grip and wrist training. Tell it what equipment you have (hand gripper,
dumbbells, wrist roller, bands, rice bucket, pull-up bar… or nothing at all) and what you're after
(max strength, bigger forearms, endurance, wrist health, climbing). It builds a weekly plan, runs
each workout with hold and rest timers, logs every set, and tracks your records. Works fully offline
and can be installed to your phone's home screen.

Design doc: [docs/SDD-v0.1.md](docs/SDD-v0.1.md) · v2 decisions: [docs/DESIGN-v2.md](docs/DESIGN-v2.md) ·
Launch roadmap: [docs/LAUNCH-ROADMAP.md](docs/LAUNCH-ROADMAP.md)

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # domain unit tests (generator, PRs, storage, workout)
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ (service worker / offline only active here)
npm run icons      # regenerate the PNG app icons
```

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request: `npm ci`, unit tests, then
typecheck + build. When a push to `main` passes, the built `dist/` is published to GitHub Pages at
`https://<user>.github.io/<repo>/`. The build reads `BASE_PATH` for that subpath. It defaults to
`/` locally, and the service worker and manifest work under either.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Dependabot (`.github/dependabot.yml`) opens monthly dependency-update PRs, and CI checks each one.

## What's in v0.1

- **Onboarding**: safety disclaimer, equipment picker (12 types), goal, experience, days per week, plan preview.
- **Plan generator** (`src/domain/generator.ts`): rule-based. It only uses owned equipment, rotates
  target qualities across days, always balances grip/flexor work with extensor work, caps difficulty
  by experience (wrist-health stays gentle), and applies each goal's sets, reps, holds and rest.
- **Library**: 43 exercises with coaching cues, filterable by equipment and target.
- **Workout player**: big steppers prefilled from last session, a 3 s get-ready plus a hold countdown,
  a rest timer (+15 s, skip), undo, extra sets, a pain-stop flow, and a screen wake lock. An unfinished
  workout survives a reload.
- **Records**: weight, hold-time and rep PRs, detected against earlier sessions (stays correct when
  history is deleted).
- **History**: sessions, details and delete. **Me**: kg/lb, edit setup (rebuilds the plan), JSON
  export/import, reset.
- **Warm-up**: a guided 3-minute bodyweight routine.

Data lives in `localStorage` under `forearmforge:v1`. Corrupt data is backed up, not discarded.

## Next (v2)

Progress charts, forearm circumference tracking, a gripper ladder (CoC levels), streaks, a 4-week
block with deload, auto-progression suggestions, custom exercises, and quick single-tool sessions.
