# T06-F — Reliability audit and lifecycle QA

**Source baseline:** `main@4561660af5c55179df90b73e0d41e5f14b75eede`, CI post-merge SUCCESS. **Scope:** React/Phaser/Audio/Coordinator, no gameplay change.

## Risk register
| ID | Suspect and location | Repro / evidence requirement | Finding | Status |
| --- | --- | --- | --- | --- |
| RL-01 | `livingCoordinator.ts:start()` repeated start | start A+B, tear down A, observe B clock; verify single interval/listener | Inert second disposer; first teardown stops shared clock | **FIX WRITTEN; CI PENDING** |
| RL-02 | `GameCanvas.tsx` delayed import/unmount | 4 remounts + visibility observer + one canvas count | Cancel/destroy present in code, real browser unverified | PARTIAL |
| RL-03 | `WorldScene.ts` repeated SHUTDOWN listeners/textures | 4 seed resets and scene remounts; inspect resource trend | Scene cleanup exists, no demonstrated leak | NOT RUN |
| RL-04 | `AmbientVisualRegistry` offscreen reentry | create/cull/recreate/clear, counts and physical objects | Pure registry unit coverage exists | PARTIAL |
| RL-05 | `WeatherAudio` duplicate one-shot or context | unlock, cancellation, reset, end, mute, remount | Budget and disconnect paths exist; existing A05-D fake AudioContext tests | PARTIAL |
| RL-06 | Camera follow stale/dead NPC | follow → death/import/reset → manual | `followTargetIsAlive` guard exists | PARTIAL |
| RL-07 | hidden-tab backlog | real second-tab switch + timer/ambient clock | clock rejects hidden deltas; E2E intentionally detects real hidden state | PARTIAL |
| RL-08 | 96×96 Graphics + textures growing over 60m | sample 0,5,…,60, compare after stable population | No physical trend yet | NOT MEASURED |
| RL-09 | import corrupted save leaves world unchanged | save.ts rejection + snapshot unchanged + v5 migration | Existing save tests, unchanged code | CI PENDING |

RL-01 demonstrates an ownership defect, **not** a proof of an accumulating memory leak. Heap growth must be checked with GC-aware repeated samples and retained-object analysis.

## Matrix selection
- Source/unit: 48×48 historical v5 and migrated v6, native 96×96; 20/50/100 NPC; four weather kinds and 6/12/18/23 hour fixture targets inherited from `e04f-integration.spec.ts`, `ambient.test.ts`, `save.test.ts`.
- Camera/viewport via existing E04-F browser suite: 1366×768, 1920×1080, 2560×1080; fit/zoom/follow, speeds 1×/5×/20× and Observer Pace 5/10/15.
- New lifecycle E2E: native v6 96×96 at seed 1/1/7/1 (100 citizens), v5 48×48 at seed 3 (20), native v6 import seed 7 (50); real resize and tab switch when supported.
- Soak: native v6 96×96/100, seed 1, 1920×1080, camera Fit, 1×, weather transitions observed rather than fabricated.
- **Uncovered combinations:** complete 3×3×4×4×4×3 Cartesian matrix, physical Windows headsets, 2560×1080 at 120m, reduced motion with physical audio. These remain NOT RUN.

## Expected invariants
One canvas, no second observer metrics closure after remount, audio active one-shot ≤4, loops ≤2, weather budget ≤ capacity, actual visible actor budget ≤4, no saved diagnostics, no hidden catch-up, monotonic tick, valid v5→v6 and v6 roundtrip, no unhandled errors. Do not treat these bounded counters as a GPU leak test.

## Execution status
Code and tests **AUTHORED**, browser test **NOT RUN** in connected GitHub-only environment. Fast CI final head must be inspected separately; tests are not declared PASS merely because files exist.
