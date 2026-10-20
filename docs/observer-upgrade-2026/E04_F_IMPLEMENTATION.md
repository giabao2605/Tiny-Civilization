# E04-F — Integration & Pacing Validation: implementation

**Date:** 2026-10-20. **Branch:** `feat/e04-f-integration-pacing-validation`. **Base:** `main@201f20c6c8a2605513a5648b442b0d8ee2279c16` (E04-E PR #33). **Scope:** Plan 04 integration and diagnostics only, no Plan 05, no deployment.

## Changes

- Kept the two previously committed E04-F test files, reviewed and extended them rather than recreating the branch.
- `src/sim/e04f.integration.test.ts`: 48/96 maps × 20/50/100 population × four seeded initial weather kinds; test every consecutive NPC step during a 36-hour window, replay 36+36 vs uninterrupted 72 ticks, v5 migration / v6 save, money and source-adjusted food/wood conservation, legitimate construction spending, validators and weather continuity. Record per-tick Node P50/P95 and route/BFS/weighted-route counters. Timing diagnostics are NOT FPS.
- `src/game/createGame.ts`: developer-only `?observerPerf=1` now exposes live Phaser FPS, frame delta, display-object/texture counts and read-only routing counters on the canvas host. No authoritative WorldState or save fields added.
- `tests/e2e/e04f-integration.spec.ts`: preserves original 24 planned particle-off weather/daylight screenshots (two map sizes, four weather kinds, three PC viewports) and 100-NPC UI/audio/camera/pacing checks; adds eight headless Chromium short profile samples spanning maps/populations and all three viewports at 96/100. Reports browser rAF P50/P95, Phaser FPS, JS heap if supported, render objects, textures and route deltas separately.
- `tests/e2e/e04f-soak.spec.ts`: opt-in **60/90/120 real-minute** Chromium soak at 96×96 / 100 NPC with five-minute snapshots, actual elapsed time, saved game, live weather, heap, routes, textures and canvases. Skipped by default with an explicit reason, and never included in required Fast CI.
- Manual-only `full-e2e.yml` now preserves the `e04f-*` screenshots and JSON in its 7-day workflow artifact.

## Hard invariants

One tick is one game hour; 24 ticks/day; legacy 1×/5×/20× speed and opt-in Observer Pace unchanged. Gameplay RNG, weather RNG, engine tick ordering, ownership rules and save envelopes unchanged. No feature creep, no separate simulation runner and no Pages deploy.

## Verification status

- Historical `main` Fast CI after E04-E: **PASS**, run [39350374219](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39350374219).
- E04-F branch test execution, typecheck, lint and build: **NOT RUN** at first authoring; see PR checks/latest commit for subsequently completed evidence.
- Headless Chromium E04-F E2E, screenshots, performance and audio: **NOT RUN** until manual workflow/PC execution.
- Hardware Windows FPS, audio listening, 60–120-minute real-time soak: **NOT RUN**. Do not infer from CI.
- No test assertion is a substitute for visual inspection of generated screenshots.

## Test commands

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e -- tests/e2e/e04f-integration.spec.ts
```

The optional 60-minute soak is **local-PC only**, not the 35-minute GitHub Full E2E job:

```powershell
$env:E04F_SOAK_MINUTES = "60"
npm run test:e2e -- tests/e2e/e04f-soak.spec.ts
Remove-Item Env:E04F_SOAK_MINUTES
```
