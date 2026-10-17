# N03-B — Weighted A* implementation

## Scope
New independent module src/sim/weightedPathfinding.ts. Production src/sim/pathfinding.ts BFS N/E/S/W and engine.ts callsites remain unchanged. No save schema, map generation, render, routine, economy, social, governance, weather, worker, backend or cache.

## Algorithm
- Geometry via dimensionsOf(world). Legacy schema v5 uses 48×48. Schema v6 uses map dimensions (currently 96×96). Invalid dimensions, length mismatch, out-of-bounds, blocked or unreachable return null. Traversable start=end returns [].
- Walkability only from world.tiles. Water blocked regardless of road metadata. Road subtype applies only to actual road terrain, so entrances/sites/POIs do not become collision barriers. Legacy road lacks subtype and uses base cost.
- Destination edge cost with integer tenths: main and plaza 10, side path 11, footpath 12, ordinary or legacy road 10, grass 20, forest 25, water impassable. No configurable nonpositive or nonfinite costs.
- Cardinal N/E/S/W neighbors, admissible consistent Manhattan heuristic ×10, binary min-heap with total tie-break (fScore, gScore, tileIndex). Relax only strictly better gScore, skip stale heap entries, reconstruct excluding start and including destination. Equal weighted-cost routes need not match BFS.
- No Math.random or wall-clock for path decisions. No mutation of WorldState, PRNG, or input terrain. No cache requiring invalidation.
- API findWeightedPath(world,start,end,stats?) and traversalCostX10; separate weighted diagnostics (calls and expanded nodes). Old BFS diagnostics remain unchanged.

## Rollback
Revert only the new module/tests/docs. Runtime BFS never switches in N03-B; N03-C owns activation.
