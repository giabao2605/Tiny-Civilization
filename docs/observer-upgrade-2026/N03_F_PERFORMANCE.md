# N03-F — Performance investigation (2026-10-19)

## Comparison validity
N03-D accepted [CI #39192577171](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39192577171), N03-E source [CI #39196924014](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39196924014), N03-E final merge [#39198471157](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157). All 27 N03-D vs N03-E 720-hour simulation/route metric records were **identical**, including deaths, consumption, trades, route calls, routeBlocked and RNG. Historical hosted p95 varied; no isolated algorithm cause has been demonstrated.

| 96×96, 100 NPC, 720 ticks | N03-D p95 (ms) | N03-E p95 (ms) | Route requests (both) |
| --- | ---: | ---: | ---: |
| Seed 101 | 9.651 | 13.288 | 11,577 |
| Seed 107 | 9.163 | 12.922 | 11,392 |
| Seed 12345 | 10.027 | 14.946 | 11,498 |

**Source of table:** `N03_E_PERFORMANCE.md` from historic GitHub Actions logs. These are **not paired same-run before/after measurements** and not N03-F numbers.

## Active N03-F instrumentation
- The existing `src/sim/n03c.integration.test.ts` owns the full **48×48 and 96×96 × 20/50/100 NPC × 101/107/12345 × 720 ticks** matrix, 27 records (9 legacy BFS; 18 96×96 BFS/guarded-weighted). Emits `N03C_SIM_BENCH` and `N03C_PAIRED_IMPACT`: engine tick p50/p95, wall time, BFS/weighted calls, weighted acceptance/fallback, expanded nodes, remaining route p50, travel cost, movement, economy, starvation, deaths and blocked counts. This must execute through Vitest.
- New `N03F_WATCHABILITY`: 18 independent 72-hour worlds, map/population/seed, moving NPC-hour density, total movement tiles, ABA goal oscillations, waiting/retry hours, route stats, activity distribution, production/consumption, trade/death/failed actions. **Separate shorter watchability window; do not conflate with 720-hour timing samples.**
- `N03F_BLOCKED_SOAK` exercises synthetic island with a real cooldown. `N03F_REPLAY` validates 1,000-hour v6 repeat.
- All timers are measured on Node/Ubuntu engine without Phaser; measurement includes JIT, GC, runner contention. No GPU/Windows FPS claim. Heap is not compared because allocations/GC need a controlled harness; process delta from historic Phase 06 is not an equivalent controlled result.
- **N03-F before/after optimization:** NOT APPLICABLE, production engine not optimized without a proven bottleneck. CI measurements to be taken from the final-head workflow logs, not invented here.

## Interpretation
A difference in p95 with matching gameplay and route calls can arise from runner/CPU/JIT/GC, but **this is a list of possible confounders**, not a confirmed root cause. Same-host interleaved comparisons or CPU profiling are required before algorithm-level conclusions. Do not add speculative caches, queues or workers.

## Measured N03-F source benchmark — GitHub Actions #39199969967

- Exact measured source HEAD `b41ede71c0f9888b6d0dc0cf5d645a321c83b45b`: [Fast CI #39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967), PASS, 34/34 test files, 278/278 cases, audit **0 production vulnerabilities**, typecheck, lint and build PASS.
- Logs contained exactly **27 `N03C_SIM_BENCH` 720-hour records**, **18 `N03F_WATCHABILITY` 72-hour records** and a 1,000-hour replay. Engine unchanged since N03-E; this is an observation-only test addition.
- **Confounder confirmed:** N03-D runner reported `AMD EPYC 9V74 80-Core Processor`; N03-E source and merge plus N03-F reported `AMD EPYC 7763 64-Core Processor`. CPU model differs; N03-D vs N03-E raw p95 **must not** be treated as a controlled before/after algorithm regression. Same-CPU N03-E merge vs N03-F results fluctuate slightly in both directions.

| 96×96 / 100 NPC, seed | N03-E post-merge weighted p95 (ms) | N03-F weighted p95 (ms) | N03-F BFS p95 (ms) | Weighted requests / accepted / fallback |
| --- | ---: | ---: | ---: | ---: |
| 101 | 13.499 | 13.019 | 8.504 | 9,904 / 2,184 / 7,720 |
| 107 | 12.331 | 12.180 | 8.152 | 9,758 / 2,088 / 7,670 |
| 12345 | 13.912 | 14.499 | 7.470 | 9,793 / 2,089 / 7,704 |

- **Same-run overhead, not an algorithm regression:** guarded weighted routing tests BFS checkpoint compatibility, then performs extra A* work; it has a higher p95 than BFS in the same N03-F run (roughly 1.5–1.9× for these samples). This is not unexpected given 9.7–9.9k weighted calls and ~1.2–1.25m expanded nodes per scenario. With the guard, most weighted searches fallback to BFS. Correctness has priority; do not remove the guard simply to improve a benchmark.
- All three weighted and BFS 720-hour runs match on deaths (2/0/0), final food production (2,499 / 2,497 / 2,511), trade counts (1,251 / 1,324 / 1,260) and route requests (11,577 / 11,392 / 11,498). No accepted performance optimization, so **algorithmic before/after: NOT APPLICABLE**.

## First 72 hours: the actual watchability profile

For 96×96, 100 NPC, seeds 101/107/12345, respectively:

| Seed | Tick p50 / p95 (ms) | NPC-hour movement density | Work hours at source / 7,200 NPC-hours | Food / wood produced | Goal A→B→A | Event-POI idle |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 101 | 4.123 / 20.420 | 81.4% | 79 | 42 / 0 | 34 | 0 |
| 107 | 4.616 / 22.600 | 80.8% | 149 | 45 / 20 | 2 | 0 |
| 12345 | 3.024 / 17.703 | 81.0% | 98 | 45 / 0 | 2 | 0 |

These are **short-window 72h diagnostic measurements**, not the full 720h economy comparison. The opening days are travel-heavy and visually sparse in productive/social activity on the 96×96 map. No ordinary event-POI visit appeared within this 72h sample. That is a **watchability gap** to evaluate before sign-off, not grounds to silently loosen survival bounds or resurrect the rejected N03-D scenic-POI experiment.

The synthetic 25h water island had five routeBlocked notices at ticks 6 (work), 18 (commons), 20 (home), 29 (home) and 30 (work). Each event came after a goal change or a retry transition; the per-active-goal cooldown invariant PASSED. A global event count of <=4 was invalid for a world crossing day/night goal schedule boundaries. This is not evidence that the same goal retries every tick.
