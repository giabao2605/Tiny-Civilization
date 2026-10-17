# N03-B — Paired pathfinding benchmark

## Method
Vitest Node test src/sim/weightedPathfinding.benchmark.test.ts logs six N03B_PATH_BENCH JSON rows. Compare production BFS vs independent weighted A* on the **same runner**: legacy 48×48 seed613 and current 96×96 seed12345, each with 20/50/100 NPC. Pair citizens with site/resource targets, add same tile, far corner and blocked-water samples. Measure one call for each algorithm per route, alternating the execution order.

Fields: Node version, CPU, platform, case count, reachable count, BFS/A* timing p50/p95 ms, median steps, median weighted route costs, A* expanded node p50/p95. Functional benchmark asserts reachability parity and weighted A* cost <= BFS cost for each reached pair.

## Caveats
No warmup, CPU not pinned, one sample per pair: noisy distribution susceptible to GC/JIT. These are path-level microbenchmarks, not integrated tick latency. N03-A tick p50/p95 cannot be compared directly as proof of A* acceleration. A* may be slower for short paths or obstacles; report negative results rather than hide them. No cache/workers until profiler evidence; allocation and heap measurements omitted as unreliable. No invented FPS target.

## Results
PENDING actual final-PR-HEAD CI log numbers. After CI completes, transcribe the six rows into this report with direct run reference. Windows physical FPS/GPU/soak remain PARTIAL / NOT RUN.
