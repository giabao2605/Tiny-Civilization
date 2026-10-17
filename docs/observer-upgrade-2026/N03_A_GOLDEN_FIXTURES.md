# N03-A — Golden Fixtures & Deterministic Trace Contract

Baseline code: `main@cf72134349e9ab3ea800393a96c48c3eb21923c8`. Frozen fixture location: `tests/fixtures/n03a-behavior-goldens.json`. Test generator and validator: `src/sim/n03a.behavior.test.ts`. The historical `tests/fixtures/legacy-v5-48x48.json.gz.b64` and `.expected.json` are **not** rewritten.

## Matrix

| Key | Source fixture | Schema | Dimensions | Population | Run |
|---|---|---:|---:|---:|---|
| legacy-v5-48-p50-seed613-t720 | Immutable legacy world SHA and queued aid from v5 source commit `4149442f` | 5 | 48×48 | 50 | tick 720→768 |
| v6-96-p20-seed12345-t0 | `createWorld96(12345,20)` | 6 | 96×96 | 20 | tick 0→48 |
| v6-96-p50-seed12345-t0 | `createWorld96(12345,50)` | 6 | 96×96 | 50 | tick 0→48 |
| v6-96-p100-seed12345-t0 | `createWorld96(12345,100)` | 6 | 96×96 | 100 | tick 0→48 |

All four run **48 hourly ticks** without clock-coupled UI. Legacy scenario submits its authentic queued governance command exactly once on tick 721; modern scenarios use empty commands. Legacy production `parseSave` migrates to v6; this fixture intentionally uses strict `parseLegacySave` to protect historical engine v5 continuation. The old 720→816 canonical SHA and v5→v6 migration are separately enforced by existing legacy and v6 tests.

## Exact projected fields

For every tick, the test projects `tick`, `rngState`, first three stable citizen IDs, current `goal`, `activity`, `tile`, `destination`, complete `route`, `lastMove`, `reason`, `hunger`, `health`, `energy`, `wallet`, `inventory`, `blockedGoal`, `retryAfterTick`, events emitted in that tick, total currency and failed action count. The per-tick event projection compares exactly `{id,tick,type,citizenId,reason}`. All 48 projections feed SHA-256 `traceSha256`; event sequence independently feeds SHA-256 `eventSha256`. Five human-reviewable structured checkpoints are at step 1/12/24/36/48. This intentionally avoids storing 48 copies of irrelevant large 96×96 terrain.

The manifest also freezes initial/final RNG state, selected IDs, dimension, seed, schema, initial/final tick, final `stateDigest`, all scenario counts (money, failed actions, `routeBlocked`, goal transitions, path calls, moving-citizen-hours), and each checkpoint. `stateDigest` is the existing deterministic FNV-derived summary of simulation objects, **not** a cryptographic hash of map tiles. Historical full-world SHA and trace SHA-256 provide complementary protection.

## What the test proves

1. Fresh execution twice gives precisely equal full `WorldState`, RNG and trace.
2. 24-tick split, serialized save/load, then 24-tick continuation equals continuous 48 ticks byte-for-byte by structural equality.
3. Every moved coordinate is cardinal-adjacent, walkable, and within the 4-tiles/hour movement budget; route tails remain cardinal and point to authoritative destination when nonempty.
4. Money, physical food and physical wood provenance are conserved with consumption/production/construction sinks; ownership never negative.
5. Dead NPC cannot resume activity, retain a route, move or spend money in subsequent ticks.
6. New event sequence remains ordered; event order and `rngState` agree on replay.

Performance numbers (Node p50/p95, calls, standalone path sample) are logged as `N03A_BASELINE`, **not** included in the deterministic golden because runner time varies. A green test with an empty golden manifest is a capture-only run; **final acceptance requires the manifest to contain all four immutable records**.

## Rebaseline policy

Never auto-update fixture on test failure. Review code and trace changes, prove no ownership/migration/PRNG regression, use a dedicated approved task to explicitly rebaseline, and keep the old expected historical SHA unchanged. Do not delete fields or relax comparisons to hide drift.
