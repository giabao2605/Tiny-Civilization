# W02-E — Save v5→v6 migration and hostile-input QA

**Status:** TESTS ADDED; final PR HEAD verification pending.

## Envelope

Legacy uses saveFormat 1 / sim-v5-phase06 / schema 5, always 48×48. New files use saveFormat 2 / sim-v6-map / schema 6 with explicit map width/height; new 96 worlds include required layout metadata. The existing 8 MiB UTF-8 cap and tiny-civilization:world:v1 localStorage key are retained.

parseSave first checks the complete envelope and validates the original save; valid legacy saves then migrate in-memory to v6 48×48. No createWorld call, regenerated terrain, forced relocation, inventory grant, ID renumbering or command rewrite. parseLegacySave keeps the strict historical v5 behavior for the unmodified golden tests. serializeSave exports v6 for schema 6 and the exact original envelope for explicit v5 worlds.

The canonicalV5Projection removes only v6 map metadata and restores schemaVersion=5 while retaining original key order, ready for whole-world JSON SHA-256 comparison. Migration does not write the imported file, modify existing localStorage data or alter an active coordinator until validation succeeds.

## Strict validation

Checks include safe integer dimensions, supported 48×48/96×96 sizes, exact terrain length, tile/route coordinates, walkability for v6, contiguous route steps, entity IDs, referenced homes/work sites/households, social/market/governance invariants, cash conservation, pending commands and request counters. For 96 layout, validation checks 3 districts, road kind coverage, entrances and existing Site references, 24 stable POIs, collisions, backup road paths and seeded reconstruction consistency.

Tests include unsupported envelope/schema/engine, missing or mismatched map, shortened terrain, negative wallet, duplicate entity/POI IDs, out-of-bounds positions, forged roads/entrances, water routes, malformed JSON, and queued commands. Atomic rollback is checked against a live coordinator's full world JSON and unchanged export before/after hostile imports.

## Acceptance evidence to check on final HEAD

The frozen v5 50-NPC seed 613 / tick 720 fixture must project to its unchanged full-world SHA-256 and continue to tick 816 without changing economic, social or governance state. Legacy and 96×96 v6 roundtrips must be exact. Any failed check is a release blocker, not an expected-digest update.