# W02-C — Isolated deterministic 96×96 generator and districts

**Baseline:** main `bd0e3891635792d93f149b88384e25ff20b8d7c5` (W02-B PR #17 merged). **Branch:** `feat/w02-c-96-world-generator`. **Scope:** W02-C only; PR for review, do not self-merge.

## Architecture

- New module `src/sim/world96.ts` exports `createWorld96(seed, population)`, `validateWorld96`, `World96State`, immutable `WORLD96_DIMENSIONS` and `WORLD96_DISTRICTS`. New state carries `schemaVersion:6,map:{width:96,height:96}` at **runtime only**. It is NOT a save format, accepted serialized v6 envelope, or default gameplay path.
- `createWorld` v5 is used **only as an unmodified bootstrap for NPC identity, market ownership, supplies, resource capacities, household structures, social/governance state and ID counters**. Its 48×48 tiles and coordinates are not used for the new layout. A separate RNG stream (`normalizeSeed(seed ^ 0x1c8e63)` plus pinned `drawInt`) creates **new** 9216 terrain cells and bounded lake/pond variation. This avoids a second copy of the economic initialization rules. It has the cost of one temporary v5 bootstrap, which W02-F may profile but must not casually optimize by changing the original RNG flow.
- Existing base home, work, market, commons and production site IDs are preserved in the new world's remapping. Five additional residential sites and, for 100 residents, twenty real individual households are allocated with increasing `nextEntityId` and no duplicate references. New home allocation has 25 × current `BALANCE.houseCapacity=4`, allowing 100 residents without new currency, food or wood. Existing owned assets and producer resource stocks are copied without rebalancing.
- `WORLD96_DIMENSIONS` is per-world data, never changes `GRID_WIDTH/HEIGHT=48`; generic helpers use `tileIndexAt` and `findPath`. Generation has one fixed terrain pass and finite road strokes, with no random retries. If an invalid road or endpoint appears, generation **throws** instead of returning a broken map or hiding the error with free resources.

## Three physical zones (not a fake label)

| District | Coordinates / geometry | Game entities |
|---|---|---|
| Residential | x=10–40, structured north/south blocks linked by five residential streets and two vertical collectors | 25 `home` sites; 100 residents occupy at most 4 each |
| Civic / Market | x=41–70, y=31–62, north-south civic spine and east-west links | 5 existing `work` sites, one `commons` (56,46), one `market` (57,46) |
| Nature / Waterfront | x=71–95, two eastern water bodies, higher forest density, north/south resource service routes | Existing `field` and `forest` resource node inventories, distributed eastward |

The new generator uses actual road terrain for accessibility rather than a 48×48 tile stretch. Grass and forest remain passable. Water remains impassable. Roads are non-weighted: N/E/S/W BFS still determines routing. Roads are **not** new `SiteKind` or a second economy.

## Safety / ownership boundaries

1. No imports from this module exist in `App.tsx`, `livingCoordinator.ts`, `save.ts`, `WorldScene.ts`, or the production creation path.
2. `src/sim/world.ts#createWorld` remains unchanged; no v5 branch or PRNG change.
3. `WorldState` continues to mean strict **v5**. Do not type-cast `World96State` to `WorldState` or call `advanceOneTick`/v5 `serializeSave` on it before W02-E supports schema-dispatched runtime/persistence. In particular, changing `schemaVersion` to 5 on a 96 world would cause incorrect 48 indexing and is forbidden.
4. W02-D owns subtype roads/entrances and decorative POI IDs. W02-E owns v6 parsing, conversion and UI enabling. W02-F owns Windows metrics and optimization.
5. Construction candidate plots in `economy.ts` remain legacy-48 and are deliberately not reused on the new world. W02-E must design size-aware construction candidate routing **before** enabling simulation. W02-C world starts with sufficient housing so construction is not needed at initialization.

**No new gameplay features, weather, audio, A*, backend, deployment or mobile support.**
