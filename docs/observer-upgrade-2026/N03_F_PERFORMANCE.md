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
