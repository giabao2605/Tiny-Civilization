# N03-F — Implementation and audit (2026-10-19)

## Baseline
- N03-E PR #27 merged into `main` as `4b815aff5b3859ea8a47f682fbdc2a44552067ab`.
- **Verified**: post-merge [Fast CI #39198471157](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157) completed **success** on that exact merge SHA.
- N03-E includes reachable fallback, bounded retry, truthful `waitingForRoute`, weather shelter adapter only, guarded time-first weighted A*, BFS fallback, v5/v6 save tests and frozen goldens. Reviewed `engine.ts`, `routing.ts`, `pathfinding.ts`, `weightedPathfinding.ts`, `world.ts`, `livingCoordinator.ts` and Phaser `src/game/scenes/WorldScene.ts` before changing source.
- No second FSM, cache, worker, population cap change, weather engine or save/schema edit. No optimization is justified by differing hosted p95 alone; leave production engine untouched pending paired evidence.

## Changes
1. `src/sim/n03f.watchability.test.ts`: observational 72-hour telemetry, 48/96 maps × 20/50/100 NPC × 101/107/12345, real movement checks, causality/reason, goal ABA oscillation, retry/waiting, bounded cooldown, food/wood/currency conservation and route counters. This complements, **does not replace**, the existing 27-record 720-hour `N03C_SIM_BENCH` matrix.
2. Additional 96×96 1,000-hour uninterrupted vs 500+save/load+500 deterministic replay. Synthetic water-island 2-cooldown soak checks NPC cannot teleport and routeBlocked reports do not flood. Synthetic map **must not be serialized** as a valid v6 save.
3. `tests/e2e/n03f-watchability.spec.ts`: actual Chromium/Phaser canvas 100-NPC 96×96 three-game-day observer test at 20×, camera Follow and Fit, reason inspector, no-water/no-teleport at final tick, page errors/console and screenshot/JSON files.
4. Manual-only `full-e2e.yml` retains `n03f-*` evidence across production smoke. **Unmodified** automatic `ci.yml`, only manual Pages deployment.

## Quality gates
The new assertions are diagnostic or contract-based. **Never** loosen N03-A goldens, N03-C paired economy assertions, 4-tile hourly path guard or v5/v6 compatibility to mask a failure. This phase is not DONE until final-HEAD CI, manual browser and artifact evidence can be checked. If a check has not run, mark NOT RUN, not PASS.

## Execution environment limitation
The isolated local runtime cannot resolve `github.com` to clone or `npm ci`; benchmark measurements in docs must come from GitHub Actions logs linked to the tested commit. Local Node/Windows frame-rate and long-soak are **NOT RUN**. GitHub connector offers repository writes and Actions result reads, but no manual workflow dispatch action; manual Full E2E cannot be certified unless a run is actually observed.

## Verified N03-F source code gate
[Fast CI #39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967) on `b41ede71c0f9888b6d0dc0cf5d645a321c83b45b` **PASS**: npm ci, 0-production-vulnerability audit, typecheck, ESLint, **278/278 tests in 34 files** and production build. Three source/test fix iterations were needed: an initial inferred `World96State` TypeScript mismatch was corrected, then a global blocked-notice assertion was replaced with a stricter same-goal cooldown invariant because distinct scheduled goals can independently become blocked. Neither engine nor golden fixtures were modified.

CI benchmark: 27×720h gameplay/route samples and 18×72h watchability samples recorded. N03-F exposes an opening 96×96 travel-heavy pattern and no natural event-POI idle in the three first-72h 100-NPC seeds. See [performance](N03_F_PERFORMANCE.md). This is **not a sign-off for overall watchability**. Manual Chromium and real Windows validation still NOT RUN.

## Follow-up implementation — fast-forward visual continuity and causal camera

Source review found a **specific presentation defect**: `livingCoordinator` publishes 20× snapshots only each four engine ticks. `WorldScene.setSnapshot` previously jumped sprites straight to the latest citizen tile when `skippedTicks` was true. This is an apparent **render teleport**, not an illegal engine move. N03-F now collects each authoritative hourly `lastMove` via `src/app/movementTrace.ts` *only at 5×/20×*, publishes an ephemeral `LivingSnapshot.renderPaths` on observer UI paints, and tweens the actual contiguous path over the corresponding fast-forward presentation interval. Trace reset on import/new seed and dead NPC; never saved or passed to simulation decisions. `movementTrace.test.ts` proves intermediate tile continuity and reset. No added PRNG calls or new tick scheduler.

`cameraInterests` now orders genuinely productive/eating/trading/socially active residents and meaningful existing world events ahead of ambient commuters. Added `startHighlightsTour` through `WorldScene`, `GameCanvas` and camera interface with **Xem hoạt động** toolbar action. It starts the existing AFK-camera mechanism immediately instead of requiring a 45–90s idle deadline, while leaving existing AFK preference and player overrides intact. Added unit regressions and Chromium steps for tour mode/screenshots.

The root **simulation routine frequency** is unchanged: the recorded ~81% travel NPC-hours in the first three days of 96×96 is still factual, not magically improved by cinematography. Fixing economic travel/schedule itself would modify the frozen N03-A 96×96 goldens and risks N03-C paired survival economics; a separate reviewed plan and baseline migration would be required. This phase deliberately solves the demonstrable render teleport and makes existing real actions easier to watch, without altering the simulation contract.

Browser/GPU improvement is **not proven until an actual manually dispatched Chromium run and visual artifact inspection**. Node unit checks cannot certify frame smoothness.
