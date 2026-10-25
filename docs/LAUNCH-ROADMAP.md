# ForearmForge: launch roadmap

Product-owner synthesis of a launch-readiness review on 2026-10-25. Inputs: a hands-on walkthrough
of the production build on a 375×812 phone viewport, plus tech-lead, security/privacy,
accessibility (WCAG 2.2 AA) and growth audits.

Process rules from [DESIGN-v2.md](DESIGN-v2.md) still apply. The owner approves every visual
change, and code ships through branch, PR, green CI, merge.

## Where we stand

The core loop works end to end: onboarding, plan, guided player, rest timer, resume after reload,
and clean empty states. All 54 domain tests pass and the build is 77 kB gzip JS. Production npm
dependencies have 0 known vulnerabilities. No XSS surface was found.

What stood between us and a public launch was **trust**:

- Data can be lost silently.
- Offline is broken for photos.
- The app is unusable with a screen reader during a workout.
- Fonts send user IPs to Google, and there is no privacy page.

## Now: in progress on `feat/launch-readiness` (no visual change)

| # | Item | Why it matters |
|---|---|---|
| 1 | Loading the app never writes storage; newer or unreadable data is protected (read-only, not overwritten); keep only one corrupt backup | Silent history wipe after a rollback, an old cached shell, or a full quota |
| 2 | Storage probe fix, two-tab sync, `navigator.storage.persist()` | A full quota made the app look wiped; two tabs overwrote each other; Safari eviction |
| 3 | Service worker: build-time precache manifest, atomic shell update, 3 s navigation timeout, no caching of error pages | Exercise photos were pruned on every launch, an interrupted update could leave a blank offline app, and gym "lie-fi" hung the load |
| 4 | Self-hosted fonts, CSP meta, no-referrer | GDPR (Google Fonts IP leak), offline first visit |
| 5 | Screen-reader announcements for timers, dialog semantics and focus for overlays and modals, focus and title on screen change, safe initial focus in destructive sheets, double-tap guard on Log set | Blind users couldn't tell a hold started or ended; Enter on the pain sheet ended the workout |

## Next: needs owner decisions (visual or product)

| # | Proposal | Evidence | Type |
|---|---|---|---|
| A | **Sticky "Log set" button** in the thumb zone of the player | On a 375×812 phone the primary action sits about 920 px down, so users scroll on every set with tired hands | Visual |
| B | **Hide the forearm-size card on the first day** (or show it below "Next up") | Day one, the measurement card pushes "Start workout" below the fold | Visual/product |
| C | **More plan variety**: Days A, B and C are currently the same 4 exercises reordered (gripper + dumbbells, max strength) | Seen in onboarding preview | Product (generator) |
| D | Contrast fixes: `--haze` to about #98a0be, pink text on cards, in-card selected chips with ice text plus a ring | 9 text pairs fail 4.5:1 | Visual |
| E | 44 px segments and chips, stack steppers below 400 px, clamp the huge rest numeral | Clipped weights like "102.5" mid-set | Visual |
| F | 1-second blank plan preview animation in onboarding: shorten it or render the content first | Looks like a bug | Visual |
| G | "Update available, reload" toast | Users otherwise get new code silently on the next load | Visual |
| H | About/Legal section in Me: privacy statement, expanded health disclaimer, photo and font credits, version | Required for any store listing; liability | Visual + copy |

## Before public launch (non-code)

- **Custom domain.** GitHub Pages project sites share `<user>.github.io` localStorage with every
  other repo on the account, so another demo calling `localStorage.clear()` wipes training data.
  A custom domain also unlocks the Play Store (TWA needs `/.well-known/assetlinks.json` at the domain root).
- Privacy-friendly analytics (Plausible, Umami or GoatCounter) with events for onboarding done,
  first workout, install, day-7 return and export. Then update the privacy page.
- OG/Twitter image (1200×630, Split Midnight), landing meta description, feedback link (GitHub issue template).
- Pin GitHub Actions to SHAs; merge the pending Dependabot majors (vite, vitest) one at a time behind CI.
- Add the `LICENSE` file and a short `CHANGELOG`. Update the README "What's in v0.1" section (the app ships as 2.0.0).

## Later (post-launch, by impact/effort)

1. **Shareable PR / ladder card** (Web Share or image). Every share is an ad.
2. **Armwrestling goal.** It reuses the generator and serves an underserved niche.
3. Persist hold and rest timers on the active session (survive iOS killing the PWA mid-hang).
4. Backup reminder (every N sessions or 30 days) and an "Add to Home Screen to keep your data" hint on iOS Safari.
5. Hangboard repeater and max-hang presets for climbers (accessory work, not a Crimpd clone).
6. Refactor Player.tsx into a tested `workoutReducer`; add jsdom/RTL tests and a Playwright smoke
   (onboard, log, reload, offline) to gate deploys; add ESLint with react-hooks.
7. Rem-based type so OS text size works; opt-in error reporting with a build SHA shown in Me.
8. Play Store via TWA after the web launch (needs 12 closed testers for 14 days).

## Launch plan (week 1)

- **Pre-launch:** domain, analytics, OG image, share card, 5 to 10 beta users.
- **Day 1, r/GripTraining:** a helpful post about the gripper ladder (3-closes rule), with the
  maker disclosed and the megathread rules followed.
- **Days 2-3:** Show HN and r/SideProject.
- **Days 3-5:** armwrestling and climbing communities, each with an angle tailored to them.
- **Days 4-7:** two short videos (ladder close, PR confetti).

**Success metrics:**

- At least 40% of visitors start onboarding.
- At least 25% of those starting onboarding finish a first workout.
- Day-7 return of 20% or more. If day-7 return is under 15%, fix the first session before
  spending more on distribution.
