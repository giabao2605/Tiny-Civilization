# N03-C — Weighted routing production integration

## Entry gate
- Base main commit: `a95dc075f86d00e8a99dbb345d647bf47843c163`, N03-B PR #24 merged.
- Exact post-merge [main CI #39018629697](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39018629697) **PASS** before branching.
- Branch: `feat/n03-c-weighted-routing-integration`. **Do not merge automatically**.

## Scope and algorithm selection
- New minimal `src/sim/routing.ts`: `defaultRoutingStrategy`, `resolvePath` and observation-only diagnostics.
- Default **v6 96×96 production: weighted A***. Default **legacy v5 48×48 and migrated v6 48×48: exact BFS**.
- The engine's `advanceOneTick` and `advanceTicks` also accept an **explicit** `'bfs'` or `'weighted'` argument. This is the rollback and controlled benchmark/compatibility interface, not a process-global mutable flag.
- Routing strategy is chosen solely from serialized schema and map dimensions. It does not depend on renderer, FPS, time, RNG, or UI visibility. No new save-schema field, API/backend or worker.
- All **movement route** calculations for new goals, unreachable-target fallback home, and cached-route water invalidation now go through `resolvePath`.
- `availableNode` deliberately retains BFS reachability-only probes for assigned/candidate work nodes. These select a reachable producer but do not become the NPC's actual movement route. This preserves node/occupancy selection and avoids repeated expensive A* calls every tick.
- `economy.ts` construction plot reachability also remains BFS: it is a boolean plot-validation query, not an NPC route.
- `src/sim/weightedPathfinding.ts` cost and tie-break from N03-B remain unchanged. Routes pay ×10 destination tile cost: main/plaza/road 10, side 11, footpath 12, grass 20, forest 25, water blocked.

## Conserved simulation rules
No changes to hunger/rest goal priority, work schedule, resource assignment algorithm, wages, market trade, households, governance, illness, construction or map generation. `BALANCE.moveTilesPerHour` remains 4 and movement still uses authoritative `lastMove` and 4-way tiles. Weighted cost **selects the path only**, not energy expenditure, speed or steps per tick. No renderer modification.

## Frozen baselines and old saves
`src/sim/n03a.behavior.test.ts` uses an **explicit BFS compatibility strategy** on all four original test scenarios (including the old 96×96 golden); literal `tests/fixtures/n03a-behavior-goldens.json` is never altered. This tests historical behavior, whereas new `n03c.integration.test.ts` checks activated weighted behavior. Migrated 48×48 save remains BFS. 96×96 save/load uses the same geometry-derived strategy before/after serialization, without altering the persisted structure. Existing pre-N03-C 96×96 saves keep their serialized routes until the normal replan; **subsequent** newly planned routes follow weighted costs. This intentional rule upgrade does not claim byte-identical continuation against an earlier BFS-only engine version.

## Rollback
Use `advanceOneTick(world, commands, 'bfs')` / `advanceTicks(world, n, 'bfs')` for complete BFS continuation while investigating. Full production rollback: revert the N03-C integration PR. Do not change golden expected fields or economics to mask regressions.

## Status
Code and test integration submitted on the branch. All N03-C tests, benchmark outputs, E2E, full CI and Windows hardware measurements must be attributed to their **actual final-HEAD run**, not inferred from the earlier N03-B PASS.

## 2026-10-19 corrective update: travel-time-safe routing

The original N03-C direct terrain-optimal Weighted A* passed [full CI #39020811689](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39020811689), but its 720-hour paired simulation **failed the gameplay-regression acceptance criterion**, even while mechanical invariants held. On 96×96 / 50 citizens / seed 101, BFS suffered 6 deaths, 702 trades, 1,131 food produced, while terrain-optimal routing suffered 20 deaths, 554 trades, 834 food produced. Three 100-NPC seeds also worsened deaths: 2→6, 1→4, 0→8. A green unit test is not permission to ship those regressions.

Root cause at the rule level: `BALANCE.moveTilesPerHour = 4` charges **time by number of traversed tiles**, not by tile terrain cost. The unconstrained terrain optimum can be longer and thus delay food/work/market arrivals. N03-C must not modify hunger, money, speed, energy, goals or economy to compensate.

Production `resolvePath(..., 'weighted')` therefore calls `findTimeFirstWeightedPath` in `weightedPathfinding.ts`: deterministic lexicographic optimization **minimum cardinal steps, then minimum terrain cost among those minimum-step routes**. It uses a positive `stepBias = tileCount * MOVEMENT_COST_X10.forest + 1` per step, so an extra step can never be offset by terrain savings over a simple path of at most `tileCount - 1` steps. The same binary heap, admissible Manhattan heuristic with minimum edge cost and deterministic tie-break are reused. `totalCostX10` still reports terrain cost alone. `findWeightedPath` keeps exact N03-B global terrain optimum as an independent API. No schema changes.

New acceptance: the N03-C 96×96 seed/population matrix asserts **no deaths increase, no food production or trade count decreases** relative to paired BFS over 720 ticks. If even a same-length route tie changes economic outcomes materially, gate fails for investigation; do not change goldens. A separate small-grid Dijkstra oracle verifies minimum steps and then terrain cost. All conclusions conditional on final commit CI and measured 30-day metrics.
