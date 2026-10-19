# E04-C ADR — Deterministic Weather, legacy-save separation

**Date:** 2026-10-19 · **Scope:** E04-C ONLY. Baseline `main@6483ae97`, PR #30 merged, Fast CI #39216281181 SUCCESS on that SHA.

## Contract / schema choice

Frozen schema **v5 stays byte-for-byte unmodified**: `createWorld`, `advanceOneTick(v5)`, historical save format 1 (`sim-v5-phase06`) and `parseLegacySave` retain the old full-world SHA-256, fixture and continuation. This is a deliberate discrepancy from the E04-C suggestion to put weather directly on v5 worlds: changing historical `createWorld` or v5 tick replay would invalidate immutable legacy golden bytes. **Runtime weather is authoritative on v6 worlds**, both newly built 96×96 and migrated 48×48. The normal coordinator already starts v6 96×96. This preserves backwards replay rather than silently rewriting history.

World schema stays at **6**: a v6 world in memory requires `weather`, while historical v6 saves without weather are hydrated only after their original validator accepts the entire envelope. **New save envelope format 3** / `sim-v6-weather` is mandatory for v6 serializations. Reader continues to accept format 2 / `sim-v6-map` and format 1 / `sim-v5-phase06`; unknown combinations are rejected. This is a small explicit migration, not a generic framework. Old format 2 must have NO weather, format 3 MUST have strictly valid weather; format 1 remains untouched. `canonicalV5Projection` excludes map/layout/weather and preserves original legacy key order.

## Authoritative model and transition

`kind` clear/cloudy/rain/fog, `intensity` (clear 0, others 0.35–0.95), `currentSinceTick`, `nextTransitionTick`, `weatherRngState` (independent xorshift32). Initial state derives from an avalanche-mixed `normalizeSeed(seed)` and fixed weather salt `0x57a7e153` (two `Math.imul` steps) before three deterministic xorshift32 draws select kind, intensity and dwell. This avoids the observed adjacent-seed first-kind bias from using salt XOR alone while leaving economic RNG entirely untouched. New imported legacy worlds initialize *at the saved tick*, with no invented weather history. All dwell times bounded **24–72 game-hours inclusive**; transitions exactly at canonical tick, no sub-tick or wall-time path, O(1) in each update. From clear/rain/fog go to cloudy; cloudy transitions to clear 40%, rain 35%, fog 25%. Clear never switches directly to rain/fog; no self-loop or unbounded state.

Only v6 `advanceOneTick` clones and advances weather. Weather RNG is not `world.rngState`, and legacy economic, social, governance, citizen selection, transaction, route and calendar order are untouched. Neither `WorldScene` nor the scheduler controls weather. Pause, hidden-tab and Observer Pace merely control whether an existing engine tick runs. E04-D can read `world.weather` and own particle/wetness without writing back to state.

## Validation, migration and atomicity

Strict enum, finite intensity, exact weather fields, unsigned nonzero RNG, integer tick relations, currentSinceTick ≤ world.tick, nextTransitionTick > world.tick, dwell 24–72. Validate old world and queued commands first; then attach seeded state to the v6 runtime. No economic RNG draws, resource changes, terrain rebuild, command loss or past tick replay. Coordinator's import path validates `parseSave` before swapping snapshot; malformed weather cannot overwrite active localStorage. New format cannot silently downgrade to old format by editing its saveFormat only, because the old format explicitly disallows a weather field.

## Rollback

Revert E04-C engine/weather rendering hook (none), leave v1/v2/v3 readers in place for safety. Never revert the new reader alone once players export v3 saves. Existing visual lighting, legacy clock and opt-in Observer modes remain untouched. No E04-D, E04-E, ambient or audio modifications.
