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

## Verified first W02-C CI regression (2026-10-16)

[GitHub Actions run #38875512363](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38875512363) completed **success**, 142/142 Vitest plus 28 executed Chromium E2E PASS and 1 skipped; frozen v5 fixture test ran as part of that suite. Immutable W02-A expected SHA-256 digests:

- Entire saved envelope: `d092ab398c3522493d67a5b2f3b83520d42f577fc7ef9f3bb240d45f3a4d40c9`
- Entire v5 world: `4450cd0df0bb29e708c2ecf89f4beeff6130acc8cb2c50e4512ccf3640ad0ea1`
- Whole world after tick720→816 replay: `0b97eb5f20f2af3004c5f153441e5acee331e727aa9b4e3d5c20277f786ad12d`

The fixtures, legacy engine and expected digests were not edited. All checks must be repeated on the **final documentation-commit HEAD**; this evidence reflects the preceding code HEAD.
