# N03-E — Performance and gameplay impact

## Instrumented baseline and method
Historical final N03-C [post-merge CI #39187351220](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39187351220) and N03-D event-only intermediate [CI #39188711226](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39188711226) are the previous hosted-Ubuntu comparisons. N03-D's speculative scenic-POI version is **rejected** and must not serve as baseline.

The inherited `src/sim/n03c.integration.test.ts` computes 720 engine hours per scenario, with seeds `101,107,12345`, counts `20,50,100`, legacy 48×48 and new 96×96 maps, plus paired guarded-weighted versus BFS comparison. Logs `N03C_SIM_BENCH` and `N03C_PAIRED_IMPACT` contain:
- engine tick p50/p95 and runtime, Node/Linux platform, CPU;
- BFS, weighted, fallback and route-request/unreachable counters;
- `routeBlocked`, movement, goal changes, trades, failed actions;
- starvation/deaths, food/wood production, consumption and inventory/cash;
- invariant and replay assertions.

N03-E adds tests for *blocked synthetic paths* but changes neither the matrix nor its golden fixtures. On ordinary connected maps, the new fallback searches are designed to remain dormant; **this is a hypothesis until final-HEAD measurements pass**. On intentionally blocked islands, up to two alternative routes are probed on a failure, then no fallback probe is needed during cooldown.

## Actual N03-E source-code measurement (2026-10-19)

- Accepted **N03-D PR #26 final source CI [#39192577171](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39192577171)** vs **N03-E source commit `80003379` Fast CI [#39196924014](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39196924014)**. Each CI ran the same existing **27 `N03C_SIM_BENCH` records** (48×48 BFS nine combinations; 96×96 BFS/weighted paired 18 records, each 720 ticks).
- **Exact agreement in all 27 records** for deaths, severe starvation, trades, food/wood production, failedActions, routeBlocked, goal changes, BFS/weighted calls, weighted acceptance, BFS fallback, route requests, unreachable requests, movement tiles and rngState. This is an empirical no-gameplay-regression result for the normal-world scenario matrix, **not** a proof about arbitrary dynamic blocked terrain.
- All nine 96×96 weighted samples reported `blockedEvents:0`, `failedActions:0`, so normal-world fallback does not add traffic. New isolated-path tests cover `routeBlocked` recovery. The legacy 48×48 and weighted-vs-BFS equality/invariant tests also PASS.
- Sampled 96×96/100 NPC measured values:

| Seed | N03-D → N03-E deaths | Food | Trades | Route requests | Tick p95 old → new (ms) |
|---|---:|---:|---:|---:|---:|
| 101 | 2→2 | 2499→2499 | 1251→1251 | 11577→11577 | 9.651→13.288 |
| 107 | 0→0 | 2497→2497 | 1324→1324 | 11392→11392 | 9.163→12.922 |
| 12345 | 0→0 | 2511→2511 | 1260→1260 | 11498→11498 | 10.027→14.946 |

- **Performance caution:** hosted Node p95 is **higher** in these samples despite identical route-call counts and exact state/results. Node CPU/JIT/GC/runner contention can differ. No claim of faster engine, physical Windows frame rate or a proven regression source is justified without paired same-run profiling. Investigate in N03-F rather than disabling checks or altering golden fixtures.
- Automatic Fast CI GitHub job wall time **2m54s**, 03:56:11→03:59:05 UTC (source `80003379`), versus N03-D old full CI job **17m44s**, 03:00:59→03:18:43 UTC. Different runs and queues, but the workflow substantially reduces automatic hosted verification time; the separate manual browser job was **NOT RUN**.
- Fast CI retains build, all 270 Vitest cases and production security audit; Chromium E2E and Windows soak remain separate gates, **NOT VERIFIED** by Fast CI. Source evidence `80003379`; documentation-only commits must not be mislabeled as measured source changes.

## Rejection triggers for N03-F
Invariant failures, blocked-event storms, increased repeated route requests on an isolated NPC, regression in paired economy gates, 4-step hourly boundary drift or unreproducible seed digests require correction before merge.
