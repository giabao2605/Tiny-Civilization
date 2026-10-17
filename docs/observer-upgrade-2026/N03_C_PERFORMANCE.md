# N03-C — Integrated simulation performance and comparison

## Prior measured context, not a N03-C result
N03-B [successful CI #39015721866](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39015721866) measured standalone weighted A* computation p50 and p95 **slower than BFS in all six 48/96 × 20/50/100 samples**, despite lower weighted route cost. Those were warm-up-free path-level samples, not integrated engine timings. See `N03_B_PERFORMANCE.md` for the original table. A* is activated only on new 96×96 worlds in this integration.

## N03-C method
Automated `n03c.integration.test.ts` executes each `48/96 × 20/50/100 × seed(101,107,12345)` for **720 ticks**. On 96×96, run matched BFS and weighted strategies in the same test process and Node runner. The 48×48 legacy worlds run unchanged BFS. Log per world:
- CPU/Node/platform, seed, population/map, strategy, 720-tick runtime and engine-tick p50/p95 (timer surrounds `advanceOneTick` only).
- BFS diagnostic calls (including availability/plot-reachability checks), weighted path calls, A* expanded nodes, movement-route request count, unreachable requests, blocked events, goal transitions, median remaining route length.
- Moved tiles and weighted cost of actually traversed tiles, travel/work hours, market trade/food/wood/needs/death snapshots.
- Paired BFS→weighted deltas for p95, trades, deaths, starvation, production, failed actions and blocked events.

The broad invariant test runs **outside** the per-tick timer. Its runtime still includes assertion overhead and is not pure engine runtime. No cache, global router flag, worker or new timing dependency is placed inside the production decision logic.

## Methodological limits
- Hosted Ubuntu/Node CPU timings depend on JIT/GC, runner allocation and test concurrency. Paired experiments reduce but do not eliminate variation. They do not measure Chrome frame timing, rendered FPS or local Windows GPU behavior.
- Total movement cost over 720 ticks can differ because two strategies perform a different number of trips; it is **not** directly a paired-path optimality proof. The separate real-NPC route test and N03-B Dijkstra oracle prove the weighted route property.
- No reliable heap profiling has been implemented. A cache would require invalidation for terrain and subtype changes; none has been added without measured need.
- Physical Windows GPU/soak remains **PARTIAL / NOT RUN**.

## Results
N03-C six-cell comparison and final-HEAD CI: **PENDING**. Publish observed results including any slowdowns; do not import N03-B microbench values and label them integrated N03-C performance.
