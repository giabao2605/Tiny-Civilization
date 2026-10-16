# V01-E → Observer Plan 02 handoff

**Branch:** `feat/v01-e-visual-performance` · **PR:** [#15](https://github.com/giabao2605/Tiny-Civilization/pull/15) **Draft, not merged** · **Base:** `main@8d639c4a`.

## Delivery state

Implemented targeted presentation polish with no simulation/save changes. Main V01-D passed its post-merge workflows. Final V01-E source `c1db2c13` passed [CI 38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446): 96 unit, 27 E2E passed, 1 skipped, no flaky retry and production smoke. 54-case comparative Chromium benchmark and visual evidence are included in the run artifact.

**Acceptance decision: PARTIAL.** Frame rates on CI remain low at 100 NPC/20× and final 54-cell mean regressed vs baseline on different CI runners. This is **not** evidence of a causal runtime slowdown or verified improvement; the condition is still open. Missing Windows GPU/CPU measurements, 60–120 minute memory soak, subjective camera/tween/occlusion quality and independent visual review cannot be marked PASS.

## Before starting the map work

1. Read `docs/observer-upgrade-2026/MASTER_PLAN.md`, Plan 01 and [implementation](V01_E_IMPLEMENTATION.md), [performance](V01_E_PERFORMANCE.md), [QA](V01_E_QA.md).
2. Owner reviews [PR #15](https://github.com/giabao2605/Tiny-Civilization/pull/15), checks the physical Windows results and explicitly accepts or defers the open gates. **Do not silently merge this Draft PR.**
3. Run `scripts/observer-benchmark.ps1` on Windows, compare current `main` vs V01-E at matched seed, hardware and zoom, then perform the specified long soak. Log FPS p50/p95/heap and screenshots/video; record any reproducible 100 NPC/20× regressions as a follow-up issue or fix in this PR.
4. Only after Plan 01 gate decision, begin W02 map expansion via its **own branch and task ID**. Legacy save v5 must retain a 48×48 world; no default migration to 96×96. Do not mix map, weather and routing into the polishing PR.

**Known risks:** short rAF CI samples, possible React/HUD simulation update bottleneck, 20× high-frequency snapshot load, small visual anchors and camera boundary easing, skip in legacy suite, no device/soak attestation. Existing scene restart cleanup and seeded replay checks remain in place; no new schema or content assets.

**Rollback:** revert PR #15 only; no migration of WorldState or save files.