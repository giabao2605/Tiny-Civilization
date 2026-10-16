# W02-B — Handoff / gate to W02-C

**Owner:** Observer Upgrade Plan 02. **PR target:** `main`, branch `feat/w02-b-dimension-aware-core`, base `094b62742c0ac9b18838cd15f243159e7a7be265`. **No self-merge.**

## Delivered

1. Explicit safe WorldDimensions grid API with row-major encoding/decoding, compatible 48-only wrappers.
2. `dimensionsOf` and `worldGeometryChanged` on world geometry; v5 remains 48 by explicit schema rather than tile-count inference.
3. World-sized BFS, walkability, terrain sampling/rendering, site/forest and camera footprint with scene restart on geometry change.
4. Legacy HUD and foundation selection dimension wiring; no new gameplay.
5. Synthetic 96 geometry/path/terrain tests and additional 576/1152 camera tests; genuine v5/viewport browser regression.
6. Required docs: [implementation](W02_B_IMPLEMENTATION.md), [geometry QA](W02_B_GEOMETRY_QA.md), [legacy](W02_B_LEGACY_REGRESSION.md).

## Deliberate legacy constraints / unresolved dependencies

- `src/sim/grid.ts` exports `GRID_WIDTH/GRID_HEIGHT` and `tileIndex/isValidTile` only for v5 generator, strict persistence and older tests; new world-sensitive consumers use world dimensions.
- `src/sim/world.ts#createWorld` has **unchanged** 48 seed/RNG flow, protected 48 spawn/roads/resources. W02-C must provide a separate deterministic 96 generator instead of mutating these values.
- `src/persistence/save.ts` still only accepts v5, and v5 imports must stay 48×48. v6 parser, migration, envelope, validation belong **W02-E**.
- `src/sim/economy.ts` construction plot candidates are legacy site coordinates; W02-C handles 96 layout rather than moving them in W02-B.
- Existing `cameraMath.ts` is pixel-dimension-aware. Reuse it, do not replace Phaser camera architecture; validate real 96 scene once generated in W02-C and persisted in W02-E.
- V01-E near-edge Follow flaked on W02-A and failed twice post-merge in Pages 38867210352. W02-B normalizes actual camera scroll on snapshot capture to guard the frame gap; First W02-B PR CI 38868350223 still FAILED near-edge Follow (27 pass, 1 skipped, 1 failed): status values were read sequentially across asynchronous render snapshots. The E2E check now reads status atomically while keeping original bounds/tolerances, alongside real clamping before camera status emission. Validate by final PR HEAD CI; no timeout/threshold waiver.
- Physical Windows FPS/heap/GPU tests still **OPEN**; do not treat CI Chromium numbers as certification.

## Gate

**W02-B VERIFIED requires final PR HEAD CI PASS** including typecheck, lint, all Vitest, build, all Chromium E2E and frozen v5 720→816 digest. No geometry correctness FAIL can be waived. Do not approve W02-C until those checks and owner review are complete. If CI is pending/failed, W02-B remains PENDING/BLOCKED and W02-C is **NOT AUTHORIZED**.

After approval/merge, start W02-C on *latest* main: deterministic 96 generator, real hubs/connectivity, 3 districts according to Plan 02. No move to W02-E or premature default 96.
