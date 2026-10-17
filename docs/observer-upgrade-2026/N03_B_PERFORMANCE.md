# N03-B — Paired pathfinding benchmark

## Method
Vitest Node test src/sim/weightedPathfinding.benchmark.test.ts logs six N03B_PATH_BENCH JSON rows. Compare production BFS vs independent weighted A* on the **same runner**: legacy 48×48 seed613 and current 96×96 seed12345, each with 20/50/100 NPC. Pair citizens with site/resource targets, add same tile, far corner and blocked-water samples. Measure one call for each algorithm per route, alternating the execution order.

Fields: Node version, CPU, platform, case count, reachable count, BFS/A* timing p50/p95 ms, median steps, median weighted route costs, A* expanded node p50/p95. Functional benchmark asserts reachability parity and weighted A* cost <= BFS cost for each reached pair.

## Caveats
No warmup, CPU not pinned, one sample per pair: noisy distribution susceptible to GC/JIT. These are path-level microbenchmarks, not integrated tick latency. N03-A tick p50/p95 cannot be compared directly as proof of A* acceleration. A* may be slower for short paths or obstacles; report negative results rather than hide them. No cache/workers until profiler evidence; allocation and heap measurements omitted as unreliable. No invented FPS target.

## Results — actual recorded CI (implementation commit 2d939d02)

Source: [Tiny Civilization CI #39015721866](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39015721866), fully successful including production smoke. Extracted from the six `N03B_PATH_BENCH` rows logged by Vitest. Runner: Ubuntu Linux hosted runner, Node v22.23.3, Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz. Seeds: 48×48 seed 613; 96×96 seed 12345.

| Map | NPC | Calls / reachable | BFS p50 / p95 ms | A* p50 / p95 ms | BFS / A* median steps | BFS / A* median cost ×10 | A* expanded p50 / p95 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 48×48 | 20 | 23 / 22 | 0.0224 / 0.4257 | 0.1262 / 1.1787 | 15 / 17 | 230 / 170 | 36 / 133 |
| 48×48 | 50 | 53 / 52 | 0.0208 / 0.0490 | 0.0801 / 0.1797 | 17 / 18 | 260 / 210 | 45 / 138 |
| 48×48 | 100 | 103 / 102 | 0.0241 / 0.0540 | 0.0483 / 0.1181 | 16 / 16 | 200 / 160 | 38 / 121 |
| 96×96 | 20 | 23 / 22 | 0.1058 / 0.2499 | 0.2874 / 2.3195 | 47 / 49 | 730 / 538 | 96 / 1290 |
| 96×96 | 50 | 53 / 52 | 0.0794 / 0.1959 | 0.1256 / 0.3592 | 46 / 46 | 677 / 488 | 110 / 1134 |
| 96×96 | 100 | 103 / 102 | 0.0973 / 0.2841 | 0.1814 / 1.7004 | 54 / 56 | 890 / 615 | 219 / 1329 |

**Interpretation:** On this single, warm-up-free, noisy CI sample, weighted A* has higher p50 **and p95 path-computation time** than BFS in all six configurations while yielding lower p50 weighted costs. Longer geometric paths can still be optimal under the declared terrain costs. Comparisons of median costs do not constitute per-route optimality evidence; the benchmark separately asserts A* cost ≤ BFS cost for every reachable paired route, and the independent Dijkstra tests verify optimum. Reachability parity holds for all sampled pairs.

**Known performance risk for N03-C:** Current A* builds a fresh per-call cost buffer and maintains a binary heap; subtype metadata and weighted searches introduce more work than the existing numeric BFS. Avoid promising a speedup or enabling A* for all NPCs without profiling actual engine path calls/tick, integrated tick p50/p95, allocation and representative 20/50/100-NPC seeds. No unverified cache or worker added in N03-B. `traversalCostX10` uses a linear scan of road metadata for individual probes; do not put it in a hot per-tile render or per-edge loop. If profiling identifies that probe as hot, optimize it in a scoped follow-up with evidence.

**QA accompanying this benchmark:** 28 Vitest files / 239 tests PASS; Chromium Playwright E2E 40 PASS; production build smoke 1 PASS. The documentation-only follow-up commit requires its own final-HEAD CI check; the figures above remain attributable to **2d939d02** and must not be misrepresented as remeasured if later runs differ.

**Hardware limit:** Windows physical GPU FPS, 60–120-minute soak and a manual target-PC playthrough remain **PARTIAL / NOT RUN**.
