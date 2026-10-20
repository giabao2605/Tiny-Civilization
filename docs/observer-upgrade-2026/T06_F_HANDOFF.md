# T06-F → Q07-A handoff

## Delivery
Working branch: `feat/t06-f-reliability` against `main@4561660af5c55179df90b73e0d41e5f14b75eede`. PR #39 merged and baseline Fast CI #39384084907 SUCCESS. **T06-F branch intentionally UNMERGED; no Pages deploy.** Final branch SHA and CI check should be taken from live PR after this document commit, not hardcoded early.

- Fixed shared coordinator clock start/stop ownership with idempotent reference-counted disposers.
- Added Vitest for duplicate start, out-of-order teardown, hidden/resume and reentry.
- Added opt-in read-only weather particle and WeatherAudio node/voice diagnostics to existing `?observerPerf=1`.
- Added manual Playwright lifecycle and wall-clock 5/30/60/120 minute resource soak suites.
- No gameplay, weather RNG, WorldState/save schema, pathfinding or economy changes; no renderer/audio engine rewrite.

## Release gates still open
- **NOT RUN:** Chromium `t06f-lifecycle`, 5-minute short, 30-minute medium, 60-minute soak, 120-minute soak, physical Windows sound and UI.
- **NOT MEASURED:** matched before/after FPS, rAF/Phaser frame quantiles, CPU, JS heap retention, GPU memory, audio lifespan trends, verified sustained 60 FPS.
- **PARTIAL:** instrumentation and lifecycle source checks do not imply a leak-free implementation.
- **PENDING:** exact final Fast CI SHA/status at document creation; verify link and test count.

## Next task prompt (copy into fresh Task)
**TASK: Tiny Civilization — Q07-A QA Test Plan & Fixtures (Observer Upgrade 2026).**

You are Lead QA Engineer + Game Engineer + Simulation Engineer. Repository https://github.com/giabao2605/Tiny-Civilization. Start by verifying the T06-F PR final SHA, Fast CI success and owner decision to merge; **do not assume T06-F is merged**. Branch only from newest validated main; do not merge or deploy yourself. Read README, docs/PROGRESS.md, docs/SIMULATION_CONTRACT.md, observer MASTER_PLAN, plans/05, plans/06, plans/07, A05_E_* QA/handoff and all T06_F_* artifacts.

Implement Q07-A end to end rather than only drafting a checklist. Establish and version a reproducible QA-01…QA-12 matrix with explicit golden seeds, v5 original 48×48→v6 migrated 48×48, native v6 96×96, populations 20/50/100, 4 weathers, dawn/day/dusk/night, pause/1×/5×/20×/Observer Pace 5/10/15, camera fit/manual pan/zoom/follow/AFK and 1366×768/1920×1080/2560×1080. Use pairwise representative combinations for broad tests and identify gaps. Extend existing `tests/e2e/e04f-integration.spec.ts`, `a05e-watchability.spec.ts` and `t06f-lifecycle.spec.ts` rather than building a competing test framework. Run test-only 30s/5min watchability captures and distinguish cosmetic handle counters from actually legible event categories. Cover weather/RNG/save/pending command correctness and a deterministic on/off comparison of observer instrumentation, audio and camera with identical tick/command digest; no fixture substitution for real gameplay.

When actual Chromium runs are available, record browser/hardware/seed/tick/viewport and screenshots. Run real Windows headphones/speaker audio and **true** 20–30/60/120 minute observer/soak sessions if the environment permits using T06-F scripts; preserve unrun items explicitly as NOT RUN/NOT MEASURED. Do not fake elapsed time, metrics, screenshots, sound QA or adjust golden fixtures to hide divergence. Execute npm ci, production audit, typecheck, lint, full Vitest and build. Demand Fast CI SUCCESS on exact final HEAD, write Q07_A_IMPLEMENTATION/QA/HANDOFF and update PROGRESS, create an unmerged PR. No GitHub Pages, Android, multiplayer or overengineering.

## Owner acceptance
Implementation and automated correctness do not equal verified PC performance or leak freedom. Require hardware-backed measurements or an explicit risk acceptance before a release-readiness claim.
