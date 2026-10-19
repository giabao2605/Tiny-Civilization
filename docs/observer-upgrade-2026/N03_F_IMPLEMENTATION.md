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
