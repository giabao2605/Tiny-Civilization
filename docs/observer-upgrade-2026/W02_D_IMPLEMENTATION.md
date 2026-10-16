# W02-D — Implementation

**Base:** main at 5c6a9d4e, branch feat/w02-d-road-entrances-pois, PR #19 draft. **Status:** IMPLEMENTED; final PR HEAD CI PENDING.

## Architecture

- New src/sim/world96Layout.ts attaches JSON-compatible layout metadata solely to the isolated 96×96 generator: three district IDs, per-road main/side/footpath/plaza kind, one explicit siteId-based entrance per functional site, and 24 authored POIs (8 each district).
- Road records correspond to authoritative terrain road cells. Grass/forest stay walkable, water impassable. No movement cost, weighted routing, A*, or NPC FSM changes.
- Extra connecting streets at y38/y55, alleys at x21/x32, genuine paved market plaza x53..61/y43..49 and southern bypass via x73/y75..83 improve the original W02-C topology. All additions reject water.
- Each entrance is a distinct road tile one orthogonal step from the economic site; its current site tile remains the real game destination. Entrances and economic/resource positions are reserved ahead of POIs.
- POI IDs poi-01 through poi-24, kind, role (decorative/event), district ID, position and display label are stable per seed. Seed variation uses pure integer hashing, not the gameplay RNG. POIs cannot occupy sites, entrances, roads or water and never create money, goods, inventories or economic sites.
- validateWorld96Layout checks enum/geometry/district bounds, all road coverage, duplicate IDs, references, overlaps, seeded regeneration equality and two genuine road-only bypasses. validateWorld96 invokes real findPath against a blocked road fixture independently. Main simulation files and v5 save schema remain untouched.

## Visual QA

src/sim/world96Visual.ts and tests/e2e/observer-w02-d-harness.spec.ts create five actual Chromium screenshot files in an **isolated harness**. It draws recognizable road subtypes, sites, doors and POIs from the generated 96 metadata. It is **not** playable 96 gameplay or production Phaser rendering. CI preserves files inside observer-w02-d-evidence/.

## Boundaries

No v5 to v6 migration, no v6 save/parser, no production 96 enablement, no changes to economic inventory, no new renderer engine, no weather/night or audio. Plan 03/04/05 and W02-E/F remain separate.

## Verification

npm ci, production dependency audit, TypeScript, ESLint, Vitest, build, Chromium E2E, production smoke and golden v5 replay must be checked on **final PR HEAD**. Until then status is PENDING, not VERIFIED.
