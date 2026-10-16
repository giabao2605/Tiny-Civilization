# W02-C — Generation, connectivity and seed-matrix QA

**Status at authoring: PENDING CI.** No local npm commands were run: coding environment has no github.com DNS route. The separate GitHub Actions PR job is the source of execution truth. No 96×96 production browser session or Windows hardware test is claimed.

## Test matrix

`src/sim/world96.test.ts` explicitly contains **10 fixed seeds**: 101, 103, 107, 109, 113, 127, 131, 137, 139, 149. The test registers each seed against **20, 50, 100 NPC**: 30 independent cases. For each case, generation runs twice and deep equality checks terrain, site/node IDs and positions, citizen data, RNG and economic/social/governance state in the full output. A third-party seed is not substituted for a failure.

| Population | Cases | Expected map | Expected sites | Resource node rule |
|---|---:|---:|---:|---|
| 20 | 10 | 9216 cells | 25 homes + 5 work + commons + market = 32 | original 2 field + 2 forest |
| 50 | 10 | 9216 cells | 32 | original 5 field + 2 forest |
| 100 | 10 | 9216 cells | 32 | original 9 field + 4 forest |

## Validator

`validateWorld96` runs during **every** creation and can be re-run on a mutated world. It checks: schema/size/terrain enum; 9216 cells; integer coordinates by `isValidTileAt`; unique monotonic entity IDs; no position collisions; exact supported site kinds; market site ID; house/work/household/node/partner/social/trade/builder references; road- and water-safe living spawn/route/target; housing occupancy/capacity; resource capacity/stock; market/citizen nonnegative holdings; **market initial currency = market cash + citizen wallets**; substantive physical district location plus actual water/forest.

For pathfinding, it calls the real `findPath` for **every unique home/site/resource/spawn** toward the market. Because BFS works on a connected undirected walkable grid, a shared reachable market proves transitive connectivity between all home/work/commons/resources/spawns. The matrix additionally checks direct citizen→home/work/commons/market, an actual resource across x>48, deterministic repeated route, water nontraversal and an impassable full-column barrier. This does not confuse yellow roads with the game's actual walkable grass/forest.

Corruption checks cover short tile array, incorrect map size, duplicate IDs, invalid spawn, dangling work/household ref, negative currency/node stock, zero-capacity home and out-of-range target.

## Timing / counts

Each matrix case records `performance.now()` generation+validator milliseconds on the executing CI runner, counts of tiles/sites/resources/water/forest and `getPathfindingDiagnostics()` count. These are diagnostic logs, not an FPS guarantee and not a Windows benchmark. Inspect the **final PR HEAD run**, not stale predecessor runs, to populate verified performance values. Explicit validation timing is included in total generation timing.

## Current evidence

- Main W02-B post-merge [CI #38872100206](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38872100206): **PASS**.
- Main W02-B post-merge [Pages #38872100308](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38872100308): **PASS**.
- W02-C matrix, typecheck, lint, full Vitest, browser E2E and build: **PENDING PR CI** until checked on final HEAD.
- Actual 96 active simulation and browser rendering: **NOT RUN / intentionally gated** until W02-E.
- Physical Windows GPU/FPS/soak: **NOT RUN; W02-F / owner-deferred**.

A failed check blocks the W02-C completion claim. Do not change golden hashes or weaken camera, money or routing assertions to make CI green.

## First complete W02-C PR CI verification (2026-10-16)

**[Run #38875512363](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38875512363) COMPLETED SUCCESS** on feature commit `c628d8fe2a4b20859d568843e4a5bdcb3787dbdc` (all code plus first-pass docs). 19/19 Vitest files and **142/142 unit tests PASS**, including all 30 generator matrix cases; **28/28 executed Chromium E2E PASS**, 1 existing skipped; npm production security audit, typecheck, lint, build and production smoke **PASS**. No failures or retries reported in the final job. Browser E2E remains intentionally v5/48×48.

The following measurements were extracted from **30 actual `W02-C generation` CI log rows**, measured with `performance.now` including validation/pathfinding, in milliseconds. They are runner-dependent and do **not** prove Windows FPS:

| Population | Cases | Functional sites | Resource nodes | findPath calls in validation per case | Min ms | Median ms | Max ms / seed |
|---|---:|---:|---:|---:|---:|---:|---|
| 20 | 10 | 32 | 4 | 36 | 27.70 | 29.03 | 65.96 / 101 |
| 50 | 10 | 32 | 7 | 39 | 20.21 | 30.35 | 33.82 / 127 |
| 100 | 10 | 32 | 13 | 45 | 21.30 | 34.72 | 41.79 / 107 |

Across the ten seeds, the map had 412–468 water cells and 1,958–2,063 forest cells; 9,216 total cells in all cases. The 20-NPC seed 101 duration (65.96 ms) is an isolated first-run outlier; record it rather than masking it, and do not extrapolate a GPU/Windows performance claim. Stock and currency checks passed; no pathfinding connectivity failures.

**Final documentation-commit CI:** PENDING at this evidence update. After this docs-only commit, check the final PR HEAD GitHub Actions run before calling W02-C fully VERIFIED. Existing test logs and immutable SHA-256 fixtures are unchanged.
