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

## Measured hosted comparison and rejected proposal (2026-10-19)

These are **real GitHub Actions logs**, not estimates: N03-C post-merge [#39187351220](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39187351220) (96×96 weighted baseline) versus event-only N03-D intermediate [#39188711226](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39188711226) (`104c08b3`; 720-hour scenario, **before** the hour-20 dwell correction). All three seeds and NPC sizes used real engine ticks. Timing is noisy GitHub-hosted Linux, and the intermediate candidate is **not** a substitute for final HEAD measurements.

| Population / seed | Baseline→event-only visits | Deaths before→after | Food produced before→after | Trades before→after | Tick p95 ms before→after |
|---|---:|---:|---:|---:|---:|
| 20 / 101 | 0 | 8→8 | 345→345 | 292→292 | 1.827→2.046 |
| 20 / 107 | 0 | 7→7 | 371→371 | 312→312 | 1.798→1.688 |
| 20 / 12345 | 2 | 8→8 | 342→342 | 296→296 | 1.933→1.900 |
| 50 / 101 | 1 | 6→6 | 1131→1158 | 702→707 | 5.366→4.619 |
| 50 / 107 | 0 | 16→16 | 935→935 | 605→605 | 4.829→3.783 |
| 50 / 12345 | 0 | 20→20 | 874→874 | 604→604 | 3.743→4.123 |
| 100 / 101 | 0 | 2→2 | 2499→2499 | 1251→1251 | 10.299→11.251 |
| 100 / 107 | 3 | 1→1 | 2527→2461 | 1334→1394 | 9.936→9.224 |
| 100 / 12345 | 1 | 0→0 | 2511→2511 | 1260→1260 | 9.612→10.299 |

The event-only trial had **0 additional deaths in all nine scenarios**, but only 0–3 visits per 720-hour world; seed 107 with 100 NPC saw a 2.6% food-production decline but higher trades, requiring a documented watchability/economics trade-off review rather than a claim of universal improvement. Pathfinding diagnostics and failedActions/routeBlocked are in the CI's `N03C_SIM_BENCH` records. The subsequent short-lived scenic-POI candidate [#39189642231](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39189642231) was **REJECTED AND REVERTED**: 100 NPC seed12345 deaths 0→2, food 2511→2464, p95 9.612→14.084ms and an immutable N03-A golden failure. Do **not** cherry-pick that revision.

**Final HEAD and post-fix browser comparisons remain PENDING** at documentation time. No physical Windows GPU/FPS nor unattended soak was performed; **PARTIAL**.
