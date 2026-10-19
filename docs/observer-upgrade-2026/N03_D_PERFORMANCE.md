# N03-D — Routing, tick performance and game-economy impact

## Baseline and measurement method

N03-C production uses both a BFS reference and guarded time-first weighted A* on 96×96, reverting when hourly 4-step checkpoints would diverge. The retained `n03c.integration.test.ts` samples **720 hourly ticks** for each seed **101/107/12345**, count **20/50/100**, 48 and 96 maps. It logs `N03C_SIM_BENCH` and `N03C_PAIRED_IMPACT` with p50/p95 ticks, BFS/weighted path calls, expanded nodes, movement, routeBlocked, failedActions, deaths, starvation, trades, money, food/wood production. N03-D adds only `leisureStarts` and `leisureIdleHours` to those existing measurements.

Compare branch-HEAD metrics against final N03-C main hosted CI [#39187351220](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39187351220), once both runs are complete. **Do not** use superseded unsafe terrain-only N03-C results (#39020811689) as the baseline.

## Expected cost and constraints (hypotheses, not observed results)

- Exactly one eligible POI lookup **per eligible citizen at 18:00**; at most existing 24 authored POIs are scanned, sorted by distance and stable ID; only ≤8-step candidates require BFS reachability probes.
- At most one additional authoritative route request on a successful evening POI decision, with no per-frame pathfinding, no new cache/worker/global state.
- A visit is at most two moves + one stationary hour, so long detours and infinite social walks are excluded structurally.
- Additional social encounters may consume the existing bounded social PRNG and interaction budget, but cannot generate assets or economy currency.

## Results to complete after CI

**PENDING (not fabricated):** N03-C gate PASS, N03-D final-head CI, 96×96 20/50/100 × 3-seed p50/p95 before/after table, BFS/weighted calls delta, events, deaths/trades/starvation/food/wood/failedActions/routeBlocked per scenario. Reject significant survival/economy degradation and profile bottlenecks before approval.

**Physical Windows FPS/GPU and 60–120 minute unattended soak:** PARTIAL / NOT RUN. Hosted Linux/Chromium and Node timings cannot certify Windows physical performance.
