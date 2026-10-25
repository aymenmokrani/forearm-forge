# ForearmForge v2: design decisions

Every decision below was approved explicitly by the product owner (acting as CEO).
Nothing visual is changed or applied without that approval.

Design canvas (Claude Design, private to the owner):
https://claude.ai/artifact/Sxx1JLbsxEeaYgZwTBieuQ

- Page **Decisions**: the round 1 and 2 feature options, chosen ones marked CHOSEN.
- Page **Look and feel**: rejected style samples. Keep as a record; do not reuse.
- Page **v2 · Split Midnight (APPROVED)**: the 12 v2 screens in the approved identity,
  **APPROVED by the owner on 2026-10-25**. This page is the visual spec for building v2
  (artboards `SM-01-Welcome` … `SM-12-Me`).
- Page **Old · Night Session (REJECTED)**: the same 12 screens in a look that was rejected (too sleepy).
  Kept as a record only; do not reuse.

## How we work (process rules)

1. The owner decides every visual question. Claude proposes, the owner chooses.
2. **Show, don't tell.** Design questions are answered with visuals (mockups, swatches,
   side-by-side options), never with text only.
3. One decision at a time, with Claude's recommendation clearly marked.
4. Never apply a new look to the app, or to existing design screens, until the owner
   explicitly approves it. Stop immediately when asked to stop.
5. Code changes ship through a branch, then a pull request, then CI green, then merge,
   which auto-deploys to GitHub Pages.

## Product decisions (v2 features)

| Topic | Decision |
|---|---|
| Where progress lives | **Progress tab** replaces History: trend chart on top, records, workout list below. Tabs: Today, Plan, Library, Progress, Me. |
| Streaks | **Weekly target streak** ("6 weeks on target", this week 2/3). Rest days count. No daily streak. |
| Gripper ladder | **Ladder of rungs** with gripper levels (Sport 36 kg, Trainer 45, Point 5 54, No. 1 64, No. 1.5 76, No. 2 88 …). A rung is claimed after a full close in **3 separate sessions**. Shows "Next target". |
| Main chart | **Heaviest set over time** per exercise, with record dots. Hold exercises chart the longest hold; the gripper shows the ladder level. No weekly-volume main chart. |
| Forearm size | **Asked every 2 weeks, on Today, before training** (a pump inflates the number). Left and right in cm, prefilled from last time, Save or Not today. |
| Gripper closes | **Logged during the workout**: pick the gripper, then Full close, Almost or No. A full close counts on the ladder automatically ("No. 1 · 2 of 3"). |

## Visual identity: "Split · Midnight" (approved)

### Layout language ("Split")
- The top of a screen is a **carved block**: slightly lighter than the background, with a
  large rounded bottom-right corner (about 40–48 px) and **one huge number** (for example the
  streak "6" at about 80–96 px) with a small label beside it.
- A **soft coral glow** sits only in the top-right corner of that block
  (radial gradient, about 22% coral, fading out by about 60%).
- Cards sit **off-center** (left inset larger than right) and have **one sharp corner**:
  radius 22–26 px on three corners, about 5–6 px on the bottom-left. This gives tension and movement.
- Character comes from layout, big type and shapes, **not** from icons or illustrations.

### Palette (Midnight)

| Role | Name | Hex |
|---|---|---|
| App background | Midnight | `#171C33` |
| Carved top block | Block | `#1F2547` |
| Cards, tab bar | Card | `#272E55` |
| Empty bars, ring tracks | Track | `#363E6A` |
| Primary text | Ice | `#F3F4FA` |
| Secondary text | Fog | `#A9B0C8` |
| Tertiary text, inactive tabs | Haze | `#7F87A6` |
| **The one action color** (buttons, streak bars) | Coral | `#FF5F3F` (text on it: `#171C33`) |
| Small labels such as "Next up" | Soft coral | `#FF8A70` |
| Charts, selection | Periwinkle | `#8EA2FF` |
| Done, success | Mint | `#4FE3B0` |
| Personal records | Gold | `#FFC857` |
| Safety ("Pain? Stop", delete) | Safety pink | `#FF4F9A` — **outline only, never a filled button** |

### Shine (subtle, never forced)
- Cards: a 1 px inner top highlight, `inset 0 1px 0 rgba(255,255,255,0.07)`.
- The coral corner glow on the carved block. No other glows.
- The primary button may carry an almost invisible top gloss. Never loud gradients or neon.

### Typography
- Headings and big numbers: **Plus Jakarta Sans** 800, letter-spacing about -0.02 to -0.03em,
  tabular numbers for timers.
- Body and labels: **Outfit** 400, 500 and 600.
- Both from Google Fonts.

### Shapes
- Soft: cards 22–26 px radius (one sharp corner, see Split), pill buttons and chips, no borders.
- Floating pill tab bar, inset 16 px from the screen edges.

### Icons and imagery
- **No decorative illustrations and no big icons.** The owner found them childish.
- **Tab bar is text only**, with a small coral dot under the active tab.
- Only tiny functional glyphs where text cannot work: back, close, minus and plus, check.
- *Superseded earlier picks:* duotone icons and flat geometric vector art. Do not use.

### Motion and feedback
- Bouncy spring for things appearing (logged sets, cards).
- Records: a small geometric confetti burst, kept subtle.
- Timer finished: a rising three-note sound plus three short vibrations.
- Respect "reduce motion" with simple fades; sound follows the phone's silent switch.

## Rejected (do not bring back)
- v1 look: plain black with orange, Barlow Condensed headings.
- Light paper or white backgrounds ("Chalk and Iron" sample): found ugly.
- Night or moon or stars motif, deep indigo with lilac: reads as a sleep app.
- Unbounded headings: felt sketchy.
- Big icons and illustrations, forced brightness (Electric, Ultraviolet and Sunrise directions).
- Explored but not chosen: Sheen, Stack, the 6 dark color combos, the light tinted backgrounds,
  and the Dusk and Slate brightness steps.

## Next steps
1. ~~Redraw the 12 v2 screens in Split · Midnight~~ Done: page "v2 · Split Midnight" on the canvas.
2. ~~The owner reviews and approves the screens~~ **Approved 2026-10-25**, as drawn. That includes
   the forearm-size card on Today (shown on its every-2-weeks day), periwinkle for selection, the hold
   timer bar and the ladder pips, a gold number for a new record, and confetti as motion only (not drawn).
3. **Next:** build v2 in the app on a branch, with a pull request through CI, matching those screens.

## Project facts
- Code: `C:\Users\Account\IdeaProjects\ForearmForge\forearm-forge` (React, Vite, TypeScript PWA, 38 unit tests).
- GitHub: https://github.com/aymenmokrani/forearm-forge (public). `main` auto-deploys to
  https://aymenmokrani.github.io/forearm-forge/ through `.github/workflows/ci.yml`.
- The GitHub CLI is at `C:\Program Files\GitHub CLI\gh.exe` (not on PATH in old terminals).
- In Git Bash on Windows, set `MSYS_NO_PATHCONV=1` before `BASE_PATH=/forearm-forge/` builds.
- v1 spec: [SDD-v0.1.md](SDD-v0.1.md).
