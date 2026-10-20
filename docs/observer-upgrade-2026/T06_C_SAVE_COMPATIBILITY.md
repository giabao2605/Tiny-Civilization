# T06-C — Reader/writer compatibility contract

| Envelope | Engine version | World schema | Map | Weather on disk | Read | Write |
| --- | --- | --- | --- | --- | --- | --- |
| format 1 | `sim-v5-phase06` | v5 | 48×48 | Absent | Frozen legacy validation, then migrate to v6 48×48 | Only when explicitly serializing v5 (fixture compatibility) |
| format 2 | `sim-v6-map` | v6 | 48×48 or 96×96 | Must be absent | Strict old-v6 validation, hydrate deterministic weather at save tick | No |
| format 3 | `sim-v6-weather` | v6 | 48×48 or 96×96 | Mandatory and validated | Strict current validation, no weather regeneration | Yes (runtime v6) |

Source-of-truth: `src/persistence/save.ts`, `src/sim/world.ts`, `src/sim/weather.ts`, `docs/observer-upgrade-2026/E04_C_WEATHER_ADR.md`. Format/engine combinations cannot be mixed. The reader rejects unknown formats/versions and format-2 weather; a 96×96 map requires layout metadata, while migrated 48×48 maps do not. Current localStorage key remains `tiny-civilization:world:v1`.

## Compatibility invariants
- First validate original envelope/world/commands; only then migrate. Invalid import does not touch coordinator state, clock, queued commands, request counter, or existing localStorage.
- Preserve all original authoritative v5 fields, including JSON key-order projection `canonicalV5Projection`. Migration adds `map:{width:48,height:48}` and deterministic weather; never expands old terrain.
- Format-2 hydration consumes **no economic RNG**, attaches `createWeather(seed,tick)`, does not fabricate historical weather, and never regenerates NPCs/roads/sites.
- Format-3 roundtrips existing weather RNG exactly.
- Exact UTF-8 file size bound: 8 MiB. Missing, malformed, oversized, invalid reference, inconsistent market money, and invalid governance request sequences are rejected.
- New guard: pending command leader ID must reference an existing citizen; do not tighten legacy election eligibility or historical 48×48 route shape.
- Serializer and parser still represent schema v5 separately; no implicit downgrade of v6 on export.

**ADR decision:** no schema/format change in T06-C, so no new version ADR. Continue to use E04-C ADR and the existing v5/v6 contracts. Rollback, if required, affects only the new cross-reference guard and its tests; do not remove readers 1/2/3.
