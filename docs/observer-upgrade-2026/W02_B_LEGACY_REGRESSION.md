# W02-B — Frozen legacy v5 regression guard

## Immutable baseline (W02-A)

- `tests/fixtures/legacy-v5-48x48.json.gz.b64`: **unchanged** genuine compressed v5 JSON.
- `tests/fixtures/legacy-v5-48x48.expected.json`: **unchanged** manifest.
- `src/persistence/legacy-v5.fixture.test.ts`: **unchanged** strict parser, byte identity, validation and replay test.
- Frozen source: seed 613, 50 NPC, tick 720, 2304 cells, 30 households, 913 directed relationships, 1 election, 1 pending governance food-aid command and 96 continuation ticks.

Expected pinned digests (SHA-256 of entire JSON strings, not reduced `stateDigest`):

```text
saveSha256              d092ab398c3522493d67a5b2f3b83520d42f577fc7ef9f3bb240d45f3a4d40c9
worldSha256             4450cd0df0bb29e708c2ecf89f4beeff6130acc8cb2c50e4512ccf3640ad0ea1
continuationWorldSha256 0b97eb5f20f2af3004c5f153441e5acee331e727aa9b4e3d5c20277f786ad12d
```

The unchanged fixture test directly regenerates legacy source JSON through `createWorld(613,50)`, 720 ticks, `serializeSave`, pending command and 96 continued hours. It checks exact save bytes, world hash, reserialized JSON, RNG/IDs, households/social/inventories/elections, unchanged coordinates and continuation at tick 816. Thus a seemingly harmless reordering of RNG draws or altered path tie-break would be detected.

## Preservation strategy

`WorldState.schemaVersion=5` stays exactly 5, with **no `map` field or changed envelope**. `dimensionsOf` returns canonical 48×48 for all v5 worlds, `tileIndex/isValidTile` keep legacy 48 behavior, and `save.ts` strictly rejects any v5 tiles outside 2304/coordinate 48. No new movement rules, spawn/site/resource positions, market, household, governance, PRNG or tick speed. `createWorld` still calls `drawInt` once per old 48 tile. No v5-to-96 auto resize.

## Status

The legacy golden is **NOT RUN locally** due unavailable GitHub network in container. Final PR GitHub Actions must run `src/persistence/legacy-v5.fixture.test.ts` via `npm run test` and report the actual outcome. A FAIL blocks W02-B: never modify frozen fixtures or expected digest to make the test pass.
