# W02-C — Legacy v5 compatibility boundary and frozen regression

**Status at authoring: PENDING W02-C PR HEAD CI.**

## Unchanged production path

Only two new `src/sim/world96*` modules are introduced; `createWorld(seed,population)`, `grid.ts`, `pathfinding.ts`, `engine.ts`, `save.ts`, React coordinator, Phaser renderer and camera are **not modified**. Production still boots/loads/saves a **48×48 `schemaVersion:5` world**. The v6 shape is only a separate TypeScript runtime value exercised by Node tests. It has no persistence adapter or browser exposure.

The v5 PRNG algorithm/order, tick = one hour, 1×/5×/20× controls, FSM, market, housing/construction, economy ownership, social/households/governance and food/wood capacities therefore receive no rule changes. W02-C asserts a v5 JSON snapshot before/after calling the new generator; this only adds a quick source-level guard, not a replacement for the strict frozen fixture.

## Golden v5 verification to remain mandatory

Existing `src/persistence/legacy-v5.fixture.test.ts` must run on final PR HEAD; do not edit it or either fixture:

- `tests/fixtures/legacy-v5-48x48.json.gz.b64`
- `tests/fixtures/legacy-v5-48x48.expected.json`

Frozen save seed 613, 50 NPC, tick720 and queued policy; verify full JSON save SHA-256 `d092ab398c3522493d67a5b2f3b83520d42f577fc7ef9f3bb240d45f3a4d40c9`, complete world SHA-256 and continued tick720→816 full world SHA-256 using the pinned manifest. `stateDigest` alone is insufficient because it omits terrain. Existing economy, social, governance, geometry and Chromium Follow/Fit/Reset/AFK/remount suites must pass without test relaxation.

## Scope of claims

Calling `advanceOneTick` on a W02-C v6 world is **not type-safe today**, because engine functions still accept `WorldState` v5. A misleading cast to v5 would break `dimensionsOf`. Therefore there is no honest W02-C v6 simulation smoke result: **NOT RUN / blocked until schema-aware runtime work**, as noted in handoff. Do not pass a v6 value through `serializeSave` v5. Legacy v5 is protected by real suite and golden fixture instead.
