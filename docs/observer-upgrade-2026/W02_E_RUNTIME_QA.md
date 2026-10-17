# W02-E — Runtime gameplay QA

**Status:** automated cases added; final GitHub Actions results pending.

## Runtime tests

src/persistence/v6.test.ts exercises the 10-seed matrix (101,103,107,109,113,127,131,137,139,149) at populations 20, 50 and 100, producing 30 separate 96×96 integration cases. Each validates 9216 terrain tiles, three districts, 24 POIs, site entrances, generator validity, production simulation through 24 ticks, split-run at tick 12, exact v6 save roundtrip and replay equivalence, money conservation and nonnegative NPC-owned currency/inventory. Existing engine/economy/social/governance suites are retained and may flag regressions.

src/sim/observerW02E.benchmark.test.ts checks actual 96 runtime at all three populations and prints W02-E-METRICS, including generation, one tick, serialization and parsing times and UTF-8 save bytes on the CI Node runner. These numbers are environment-specific, not promises of local Windows performance. A separate construction check exercises a real 96 plot, worker construction and updated metadata validation with no money creation. W02-F remains responsible for physical Windows FPS, memory, GPU profiling and longer soak.

## Acceptance / blockers

Pathfinding stays BFS with N/E/S/W ordering, no route stride 48, no water traversal, no teleporting and independent dimensions for concurrent v5/v6 states. Construction must not consume protected POI, road, site or entrance cells. Save/load must resume with identical seed and RNG progression. Browser production movement, camera and persistence are covered in observer-w02-e-production.spec.ts; do not substitute generator harness pictures.

Final head CI, benchmark logs, screenshots and any failures must be recorded before marking this file VERIFIED.