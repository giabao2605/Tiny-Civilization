# W02-F — Map Density & Performance Implementation

**Scope:** Observer Upgrade 2026 / Plan 02 / W02-F only. **PR:** [#21](https://github.com/giabao2605/Tiny-Civilization/pull/21), branch `feat/w02-f-map-density-performance` from `main@eb0a4d503f0124267e298443d6fd839c5d64de12`. **Status:** candidate GitHub CI PASS; final evidence/Windows QA pending; do not self-merge or mark VERIFIED until final-HEAD CI, browser evidence, and owner review.

## Entry gate

- W02-E [PR #20](https://github.com/giabao2605/Tiny-Civilization/pull/20) merged at `eb0a4d50`.
- Actual post-merge CI [#38995262805](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262805) and Pages build [#38995262917](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262917) both completed success. CI included npm ci, audit, typecheck, lint, unit, build, Chromium E2E, production smoke.
- Source/docs audited: contract, Master/Plan 02, W02-A/B/C/D/E handoffs, legacy SHA fixtures, W02-E runtime; WorldScene, artKit, terrain, createGame, GameCanvas, livingCoordinator, engine, pathfinding, world96/layout, economy and persistence.

## Evidence-based bottlenecks and changes

1. Main post-merge rAF Chromium profile reports 100 NPC at 20× and 1920×1080 Fit: 5.63 FPS, p95 ~300 ms, while at 1× it reports 18.20 FPS. Headless browser evidence, not hardware Windows results.
2. `WorldScene.paintLayout` allocated 32 individual entrance Graphics for a static metadata layout. One batched static Graphics now draws all entrances at ground depth to reduce display-list work without inventing a gameplay site.
3. Every NPC eagerly allocated a Phaser Text texture even when zoom was below the label threshold of 2.4. Labels are now allocated lazily upon first close inspection; normal Fit sessions avoid ~population additional textures while preserving labels/selection when zoomed.
4. Forest/grass/market sparse decoration is painted as small deterministic ground decals in existing static layout Graphics. Only real non-reserved grass cells are eligible; no road/water/site/entrance/POI/resource collision, no simulation RNG calls, no new economic objects.
5. `findPath` kept exact BFS N/E/S/W exploration, while replacing per-neighbor position objects and redundant grid dimension validation with numeric neighbor indices. No A*, no path costs, no unbounded route cache. Reference pre-W02-F BFS is preserved in a parity/performance **test only**, not production.

6. W02-F caches the 828-road-cell static hierarchy plus deterministic decor as a single Phaser generated nearest-filtered overlay texture. No repeated live Graphics redraw every frame and no changes to world tiles.

## Current CI evidence

- Pre-optimization W02-E baseline [#38997723836](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38997723836) **PASS**, 36 viewport/population/speed cells.
- Optimized candidate [candidate CI #38999049391](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38999049391) **PASS**: typecheck, lint, unit/parity, build, real Chromium E2E, production smoke.
- At 100 NPC/20×/1920×1080 Fit: mean 7.10→10.15 FPS (short CI rAF capture), p95 216.6→166.6ms, GameObjects 512→481, textures 123→24. Node tick p95 120.824→11.861ms on same input. **Not** Windows or long-term 60 FPS certification.
- Two of 36 short captures show lower FPS; needs long-run/hardware recheck. Final W02-F artifact preservation and long-sample benchmark pending.

## Tests and limits

- `src/sim/w02f.benchmark.test.ts`: fixed seed 12345; 48 ticks per population; tick p50/p95, path calls/tick, generation, save serialization, roundtrip, heap. Node only.
- `src/sim/pathfinding.w02f.test.ts`: exact routes vs frozen old BFS on 48/96, invalid coordinates, same-cell; comparative timings without performance threshold assertions.
- `tests/e2e/observer-w02-f-perf.spec.ts`: actual Phaser 96 map, 20/50/100 × 1×/5×/20× × 1366×768/1920×1080/2560×1080/900×650, rAF frame samples, gameObjects/textures, JS heap, no page errors.
- `tests/e2e/observer-w02-f-visual.spec.ts`: actual canvas screenshots Fit, Residential Follow, Civic, Waterfront, ultrawide and small.
- Existing frozen v5 hashes, v5→v6 48 migration, v6 96 roundtrip, economy/social/governance, camera and Playwright suites must remain unchanged and pass.

No worker, no rewritten simulation clock, no Plan 03 weighted navigation, no Plan 04 weather, no ambient audio, no new site. The local container cannot clone github.com due DNS resolution. Actual npm/Chromium commands execute in GitHub Actions; no claim of a local Windows run. Check [Performance](W02_F_PERFORMANCE.md), [Visual QA](W02_F_VISUAL_QA.md) and [Handoff](W02_F_HANDOFF.md).

## Rollback

The optimization is a separate PR. Revert W02-F commit(s) if FPS regresses materially, golden/replay fails, labels cease to show at zoom, entrances cover NPCs, or any renderer lifecycle leaks. Never touch the immutable W02-A v5 fixture or silently resize legacy worlds.
