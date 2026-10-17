# W02-D — Road-only redundancy and real BFS verification

**Status:** TEST CODE IMPLEMENTED, PR HEAD CI PENDING.

Simulation BFS remains unweighted with passable grass and forest. A successful findPath alone cannot prove dual-route streets. Dedicated roadOnlyPath traverses **only metadata-backed road cells** and supports a blocked segment; this QA helper is not used for NPC movement.

## Fixture A: Residential → Civic

From (40,46) to (57,46); block road cell (45,46). Alternative roads via civic y38/y31/y55/y62 and x40/x57 must still connect. Endpoints remain untouched.

## Fixture B: Civic → Waterfront

From (57,46) to nature hub (73,83); block (70,79). Alternative route via y75 and the x73 southern branch must still connect. The test checks original and obstructed road-only paths without water and then clones terrain, converts only the blocked cell to water and invokes real findPath. The original world remains unchanged.

All sites, resource nodes and citizen spawns must be reachable to market via unchanged real findPath. Negative cases sever road metadata and must fail validation. Grass-only detours must not be counted as redundant road-network PASS.

These are representative multi-route hub checks, not proof that every individual dead-end resource spur withstands arbitrary removal. Pathfinding call counts and timing: PENDING CI logs.
