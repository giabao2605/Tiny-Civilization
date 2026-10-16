# W02-B — Dimension-Aware Core & Legacy Mode

**Scope:** Observer Upgrade Plan 02 / W02-B only. **Base:** main `094b62742c0ac9b18838cd15f243159e7a7be265` (W02-A PR #16 merged). **Branch:** `feat/w02-b-dimension-aware-core`. **Delivery:** separate PR, not auto-merged.

## Design and implemented changes

| Module | Implementation | What remains intentionally fixed |
| --- | --- | --- |
| `src/sim/grid.ts` | `WorldDimensions`, `LEGACY_DIMENSIONS`, `isValidDimensions`, `isValidTileAt`, `tileIndexAt`, `tilePositionAt`; safe integer and finite bounds, row-major encode/decode | `GRID_WIDTH=48`, `GRID_HEIGHT=48`, `isValidTile`, `tileIndex` retained **only as explicit v5 compatibility wrappers**; `TILE_PIXELS=12` |
| `src/sim/world.ts` | Central `dimensionsOf(world)` discriminates v5 (always legacy 48×48) from **geometry-only synthetic shape** with `map` (96×96 test); `walkable` indexes with dimensions; `worldGeometryChanged` detects map footprint changes | `WorldState` is still schema **5**; legacy generator, coordinates, one RNG draw per tile and all IDs unchanged |
| `src/sim/pathfinding.ts` | BFS checks world tile count/dimensions, uses sized encode/decode and correctly sized queue/visited arrays | N/E/S/W order, shortest deterministic path, water collision and speed/AI untouched; no A* |
| `src/game/render/terrain.ts` | Dimensions passed explicitly, `terrainAt` uses sized neighbor stride, full-sized tile iteration | Existing colors, hash, 12px art style untouched; no chunks |
| `src/game/scenes/WorldScene.ts` | World pixel width/height and forest/site/door indexing from `dimensionsOf`; Fit, Reset, pan, Follow, AFK and clamp reuse existing camera math on actual pixels; scene restarts on world geometry swap even if seed/population identical | Existing tweening, pan/zoom/reduced-motion and AFK timing semantics unchanged |
| `src/game/GameCanvas.tsx` | Data attributes expose active dimensions to regression tests; existing ResizeObserver, remount and snapshot update paths retained | No separate simulation clock; `createGame.ts` already sizes canvas from host (no hardcoded map bounds) |
| `src/app/App.tsx` | HUD size comes from current `world` | No new gameplay UI |
| `src/app/coordinator.ts` | Foundation-only coordinator optionally validates against explicit dimensions; default remains legacy 48 | No change to living coordinator or gameplay selection |
| `src/sim/quality.benchmark.test.ts` | Route bound now `width * height` from the world | Balance formulas and benchmark scenarios untouched |

## Audit resolution

Per `W02_A_GEOMETRY_AUDIT.md`, all generic indexing points in grid, walkable/BFS, rendering, camera bounds and scene identity now receive world/explicit dimensions. `engine.ts`, `economy.ts`, `social.ts` and `governance.ts` need no direct rule changes: engine/economy already route via the refactored `findPath` and `walkable`, while social/governance have no direct grid-index assumptions. The legacy generator's loops, road/site construction and spawn coordinates **must remain 48** until W02-C. `src/persistence/save.ts` deliberately remains strict v5 (2304 tiles/48 coordinates) until W02-E. Historical test screenshots and 576px examples remain v5 fixtures.

## Boundaries

No v6 `WorldState` schema in production, map metadata in v5 JSON, version bump, migration, 96 playable generator, district/POI/road hierarchy, weather, audio, A*, renderer rewrite or gameplay economics. A `schemaVersion:6` **geometry-only type used by tests** is not a v6 save implementation. Only W02-E may enable or persist full v6 worlds.

## Rollback

Revert this PR to restore previous v5-only indexing/rendering without touching frozen fixtures. Never regenerate or rewrite the source v5 baseline to hide a geometry regression.
