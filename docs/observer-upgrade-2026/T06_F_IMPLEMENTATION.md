# T06-F — Long-running Reliability & Resource Cleanup

## Baseline / scope
PR #39 **MERGED** into `main@4561660af5c55179df90b73e0d41e5f14b75eede`; exact post-merge Fast CI [#39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907) **SUCCESS**. No newer main commit/open feature PR superseded this baseline at branch creation. Work is on `feat/t06-f-reliability`, not merged and not deployed.

PC localhost/Windows only. No simulation mechanics, tick frequencies, weather RNG, WorldState or save schema changes. The runtime app remains React + Phaser + TypeScript simulation.

## Evidence-based issue and minimal fix
**Confirmed from code:** `src/app/livingCoordinator.ts` previously returned an inert disposer from the second `start()`. If two consumers start the same coordinator, the first teardown stopped the single interval and removed the visibility listener even though the second still held a live lease. This is a lifecycle ownership bug, not a measured memory leak. `start()` now reference-counts callers, installs one interval/visibility listener only once, provides individually idempotent disposers, and stops only after the final lease. `livingCoordinator.t06f.test.ts` tests double start, out-of-order/repeated teardown, restart and hidden/resumed clock progression.

**Read-only instrumentation:** The existing development-only `?observerPerf=1` function now reports `audio` diagnostics from React's *existing* WeatherAudio owner and `weatherVisuals` capacity/active particle budget from the existing WeatherLayer. The audio bridge adds an optional diagnostics getter, without moving the AudioContext into Phaser or creating a new scheduler. The same bounded Phaser/ambient, texture, routing and FPS telemetry is retained.

**Browser QA scripts:** `tests/e2e/t06f-lifecycle.spec.ts` exercises real seed resets, v5 import, native-v6 import, canvas remount, camera follow/fit/zoom, save roundtrip, and a real tab-switch when Chromium supports it. `tests/e2e/t06f-soak.spec.ts` opts into *actual elapsed* 5, 30, 60 or 120 minutes and samples every five minutes. It captures screenshots, rAF cadence quantiles, Phaser FPS/delta, JS heap when exposed, game objects/textures, weather particle budget, audio node/voice counts, ambient creation/destruction, tick, weather, runtime exceptions and unhandled rejections. It never turns the virtual clock forward to fake soak time.

## Lifecycle audit findings
| Area | Observed source / control | Risk classification |
| --- | --- | --- |
| Coordinator timer and `visibilitychange` | `livingCoordinator.start()`; double start disposer failed shared lifecycle ownership | **CONFIRMED LIFECYCLE BUG**, fixed; no proven memory leak |
| React Phaser mount | `GameCanvas.tsx`: rAF cancellation, ResizeObserver disconnect, `game.destroy(true)`, metrics closure deleted | Cleanup exists; browser repetition NOT RUN |
| Scene shutdown | `WorldScene.create()`: one-shot SHUTDOWN handler removes pointer, visibility and reduced-motion listeners, clears maps, disposes ambient/weather/lights | Cleanup exists; real repeated restart NOT RUN |
| Camera and follow | `WorldScene.setSnapshot/update()`, `afkDirector.ts`: dead/invalid follow target switches to manual; timer cleared at shutdown | Source-backed; E2E NOT RUN |
| Ambient actor/visual handles | `AmbientDirector` max active 4, `AmbientVisualRegistry` culls/destroys and tracks create/destroy | Bound exists, real GC/GPU trend NOT MEASURED |
| Audio context and one-shots | React-owned `WeatherAudio`: one context, 2 loops, ≤4 one-shots, reset/destroy disconnects, oscillators end cleanup | Source-backed and existing mocks; physical audio NOT RUN |
| Weather particles | `WeatherLayer` static bounded particle array and one drops Graphics, no per-particle Phaser objects | Capacity now directly reportable; heap/GPU NOT MEASURED |
| Save and replay | `persistence/save.ts` strict import and legacy reader; simulation contract remains unchanged | Existing regression coverage; final CI pending |
| Hidden tab | `clock.onElapsed(delta, visible)` discards unseen/long frames; director ignores hidden frames | New real-tab test authored; not executed |

**Memory leak classification:** No heap trend captured in this environment, so no leak is claimed proven and no leak-free certification is given. Legitimate site/citizen growth and GC delay must be separated from retained unreachable objects in follow-up PC profiling.

## Changes deliberately avoided
No renderer rewrite, pooling speculation, mutation of weather/audio RNG, new diagnostics subsystem, non-optional realtime profiler, unbounded heap logger, and no 60 FPS claim. The new rAF ring is bounded to 240 intervals and is test-only.

## Acceptance
**PARTIAL** pending final Fast CI and manual soak/Windows hardware evidence. See the QA documents and T06_F_HANDOFF. Do not merge or deploy automatically.
