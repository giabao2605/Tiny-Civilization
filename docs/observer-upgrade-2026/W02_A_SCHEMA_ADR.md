# W02-A — ADR-02: World dimensions + v5 compatibility (2026-10-16)

**Status: ACCEPTED FOR IMPLEMENTATION IN W02-B…E; NOT IMPLEMENTED IN W02-A.** Scope: one local PC world at a time, 48×48 legacy and 96×96 new worlds. Based on actual `main` at `4149442f`, Plan 02 v2 and `SIMULATION_CONTRACT.md`.

## Decision drivers

1. Each world must carry its own dimensions; no global variable can choose the meaning of a tile/index for two different loaded worlds.
2. v5 format 1 / engine `sim-v5-phase06` contains exactly 2304 terrain cells with no dimensions, and requires strict v5 validation. A valid old save MUST remain 48×48 forever.
3. The same v5 seed, tick, RNG state, ID counters, sites, NPC locations, routes, pending governance commands, all inventories/currency/trades/history, relations, households and leadership must be preserved exactly.
4. Terrain remains the authoritative row-major `tiles` array. Phaser pixel size is presentation only, never gameplay geometry. Do not introduce chunks, ECS, second map storage or new engine.
5. The v5 BFS north/east/south/west ordering, 1 tick = 1 hour, 1×/5×/20× and seeded decision rules must remain intact.

## Alternatives evaluated

| Option | Design | Benefits | Costs / risks | Result |
| --- | --- | --- | --- | --- |
| **A** | `WorldStateV6.map: {width,height}` + `tiles` unchanged; functions accept explicit dimensions or read from world | Clearly owned geometry, easily validates tile count, JSON-safe, minimal gameplay refactor, avoids inferred width | Versioned migration and caller changes required | **CHOSEN** |
| **B** | Add top-level `gridWidth/gridHeight` on WorldState | Smallest number of wrapper levels, trivial deserialization | Scatters future map metadata at root, error-prone when other map attributes arrive, still needs same refactor/version bump | Rejected |
| **C** | Infer square dimensions using `Math.sqrt(tiles.length)` or set mutable module-level constants | Avoid immediate schema bump | Invalid tile arrays can be misread, fragile for non-square maps, globals break coexistence, no explicit contract; dangerous v5 conversion | Rejected |

Option A is only a **contract** in W02-A. None of its interfaces is merged into production code until W02-B+.

## Proposed TypeScript interfaces (future, not existing source)

```ts
export type WorldDimensions = Readonly<{ width: number; height: number }>;
export type SupportedMapSize = 48 | 96;
export type WorldMapV6 = Readonly<{
  width: SupportedMapSize;
  height: SupportedMapSize;
}>;
export type LegacyWorldV5 = Omit<CurrentWorldStateV5, 'schemaVersion'> & {
  schemaVersion: 5;
  // no map field, exactly 48 * 48 tiles
};
export type WorldStateV6 = Omit<CurrentWorldStateV5, 'schemaVersion'> & {
  schemaVersion: 6;
  map: WorldMapV6;
  // tiles: Terrain[] remains authoritative
};
export type SerializedWorld = LegacyWorldV5 | WorldStateV6;

// One world -> one dimension value. Caller MUST NOT guess from viewport or tile count.
export function dimensionsOf(world: SerializedWorld): WorldDimensions {
  return world.schemaVersion === 5 ? { width: 48, height: 48 } : world.map;
}
// Generic geometry MUST always receive explicit dimensions.
export function tileIndexAt(tile: TilePosition, d: WorldDimensions): number | null;
export function isValidTileAt(tile: TilePosition, d: WorldDimensions): boolean;
export function tileAt(world: SerializedWorld, tile: TilePosition): Terrain | null;
export function findPath(world: SerializedWorld, start: TilePosition,
  end: TilePosition): TilePosition[] | null;
```

The `CurrentWorldStateV5` name above describes a **future type alias** to the current exact v5 fields. It does not exist in the codebase today. Validating the dimensions is **not** the same as allowing arbitrary numbers: initial supported combinations are only (48,48) and (96,96), positive safe integers, no mismatched width/height and `tiles.length === width * height`. Versioned v6 validator rejects unknown map keys/invalid lengths and positions. Keep room for a later rectangular-world ADR without implementing it now.

The existing `tileIndex(tile)` and `isValidTile(tile)` exports may remain temporarily as **explicitly deprecated legacy-48 wrappers** for old tests/callsites, but generic code must use the new dimension-aware APIs. Never reinterpret them as silently using an ambient world. `TILE_PIXELS = 12` remains a renderer scale constant; do not let it leak into indexing.

World v6 `map` has only size in W02-B. District, entrance, POI and road-subtype metadata is added (if needed) in W02-D under separately validated optional structures, not conflated with economic `SiteKind` or walkability. Forest remains walkable; water blocked; road variants must not change BFS costs without Plan 03 ADR.

## Encoding / route and rendering rules

- Index encoding: `index = y * dimensions.width + x` after integer/bounds check. Decode: `x = index % width`, `y = Math.floor(index / width)`; ensure `0 <= index < width*height`.
- Stable cardinal ordering N,E,S,W and behavior on unwalkable water maintained for legacy.
- Validate `citizen.tile`, `destination`, `route`, `lastMove`, `site.tile`, `node.tile`, `construction.tile`, and future anchors, plus length cap by `width*height`.
- For v6 save, renderer should derive world pixels as `width*TILE_PIXELS` and `height*TILE_PIXELS`; use real dimensions for drawing, camera clamps, Fit/Reset/Follow/AFK, scene replacement and HUD size label.
- No global `currentWorldWidth`, module-level mutable map or `Math.sqrt(tiles.length)` fallback. Avoid copying giant arrays purely to read dimensions.

## Save envelope and migration contract (for W02-E)

```ts
type V5Envelope = {
  saveFormat: 1;
  engineVersion: 'sim-v5-phase06';
  world: LegacyWorldV5;
  pending: GovernanceCommand[];
  nextRequestId: number;
};
// Proposed versioned export format, to be finalized in W02-E:
type V6Envelope = {
  saveFormat: 2;
  engineVersion: 'sim-v6-map';
  world: WorldStateV6;
  pending: GovernanceCommand[];
  nextRequestId: number;
};
```

1. Parse JSON with the current 8 MiB UTF-8 cap and hostile-input checks. Dispatch by exact `saveFormat` **and** `engineVersion`; do not loosen v5 validation to accept 96 or extra guessed dimensions.
2. Apply the **original v5 field and reference checks** before migration. v5 implies exactly `{width:48,height:48}`; construct a new v6 world with only `schemaVersion:6` and `map:{width:48,height:48}` added/adjusted; preserve the original array entry order and every other field/value. Do not call `createWorld` on import, regenerate terrain, renumber IDs, teleport or correct inventory.
3. Validate the v6 result with `tiles.length === width*height`, references, counters, bounds and money conservation. Migrate `pending` and `nextRequestId` without rewriting request IDs/ticks. Reject unsupported/invalid saves atomically, leaving the active world untouched.
4. v6 export writes versioned envelope; v5 input remains readable. Never overwrite the original imported JSON file; localStorage operations keep their existing explicit user controls. Capture canonical v5 projection `(remove map, set schemaVersion back to 5)` and compare **whole-world JSON** to the original; full-json SHA-256 and continued game-state comparisons are mandatory.
5. Preserve v5→v6 gameplay **semantics**; a new v6 envelope necessarily changes byte digest (version/metadata). Compare the canonical v5 projection and deterministic continuation (including RNG, money, household, governance and queued commands). If exact projection fails, migration is BLOCKED, not silently accepted.

**Important:** `stateDigest()` currently excludes `tiles`, so it is **insufficient** to prove map preservation. Golden fixture `tests/fixtures/legacy-v5-48x48.json.gz.b64` is real `sim-v5-phase06` 50 NPC save from seed 613 / tick 720 with queued governance order; manifest stores full save/world/continued-world SHA-256. A v6 world must pass equivalent full-map assertions. Golden fixture and original engine v5 loader stay stable until migration tests are green.

## Sequence and checkpoints

- **W02-A (this PR):** inventory every consumer; freeze valid v5 fixture & replay SHA-256; approve this ADR. No schema/code refactor.
- **W02-B:** introduce `WorldDimensions` geometry helpers; refactor pathfinding/terrain/scene bounds and UI to request world dimensions. Keep legacy v5 world 48 and its parser unchanged. Unit tests: (0,0),(47,47),(48,0) rejection in 48; *synthetic* explicit 96 encoding (95,95)=9215, (96,0) rejected; BFS 96 test with water and decode; camera Fit/Follow/AFK synthetic dimensions. No production 96 generator or v6 export yet.
- **W02-C:** independent deterministic 96×96 generation and 3 real districts with validated economic sites/roads/resources. Initially gated from default play/export until v6 persistence can protect it. 10 seeds × 20/50/100, connectivity, stable IDs and production checks. Legacy createWorld behavior stays pinned.
- **W02-D:** roads/entrances/decorative POI metadata, >=20 valid unique anchors; no new economic site types; 2-route hub resiliency and screenshot tests.
- **W02-E:** explicit v5/v6 parser and v5→v6 migration, strict validation and v6 export; test legacy import stays 48, new 96 roundtrip, invalid input is atomic, canonical v5 projection and split-run continuation; only then allow 96 to become default.
- **W02-F (out of scope):** density/performance, real Windows matrix, larger map renderer profiling/soak. Owner-deferred V01-E gates remain open.

## Quality / rollback policy

A failed v5 golden, malformed 96 index, screenshot outside bounds, lost financial/ID conservation, or non-deterministic replay is a release blocker. W02-C/D 96 generation must be feature-gated while E migration/export incomplete. Rollback to legacy world creation is a **new-world-only** switch; never resize an imported v5 save or rewrite the original JSON. No changes to Phaser/React stack, gameplay laws, PRNG, scheduler or multiplayer/cloud.
