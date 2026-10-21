# T06-D — Implementation (2026-10-21)

## Scope and preflight
T06-C PR #43 MERGED at `main@00e8706998d3c55d195ad06242ad1eb3c01d7b46`; exact post-merge Fast CI #39399807790 SUCCESS. All changes are on `feat/t06-d-render-map-performance`, Draft PR #44. Do not merge or deploy.

## Profiling
Historical T06-A/T06-B Node CPU tests show 96x96/100 NPC simulation and routing are meaningful independent costs; Node timings cannot be treated as rendered FPS. T06-D adds a Chromium rAF profiling workflow that checks out exact main baseline and branch candidate on the same runner, with 3 samples per case. Earlier 72-case browser harness on Ubuntu timed out when changing camera after sustained 20x, so final harness reloads a new seeded world per mode and configures camera before enabling 20x. Do not discard low-FPS samples. Actual before/after output must be read from the paired workflow artifact/log when complete.

## Source changes
Existing static terrain and road detail were already rasterized once; keep this design. Source-only renderer adjustment in `src/game/scenes/WorldScene.ts`: track decorative forest tree image handles and toggle `visible` for sprites outside a camera viewport expanded by 30px; when camera returns, reuse the same sprite. The visibility pass is skipped when camera viewport is unchanged. No simulation/world save, terrain, routing, RNG, actor schedules, NPC tween, clock or tick semantics modified. Scene SHUTDOWN clears tree references. DEV diagnostics expose `forestDecorationsTotal` and `forestDecorationsVisible`.

## Verification status
Fast CI on the first code candidate `f22c8382`: SUCCESS, 51/51 test files, 444/444 tests, audit, typecheck/lint/build. New exact final HEAD and paired browser workflow: **PENDING confirmation**. Browser tests include forest zoom/fit texture stability and genuine historic v5 48x48 import. Physical Windows/PC FPS, GPU/audio, 60-120-minute soak: NOT MEASURED. Rollback tree culling if the paired measurements show significant regression.
