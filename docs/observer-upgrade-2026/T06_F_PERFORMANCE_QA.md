# T06-F — Performance instrumentation and evaluation

## Measurement contract
The following are separate metrics: `Phaser.Game.loop.actualFps` (Phaser estimate), `frameDeltaMs` (Phaser delta), Playwright bounded ring `rafCadenceP50Ms/P95Ms` (browser callback spacing, **not GPU draw time**), JS used/total heap (nullable), Phaser GameObject and texture counts, ambient scheduler/handle counts, weather particle capacity/active budget, and WeatherAudio loops/one-shots/create/release counters.

T06-F adds only **read-only** `weatherVisuals` and `audio` entries to existing `?observerPerf=1`, and only in Vite development mode; not WorldState, save schema, gameplay RNG, new textures or timers. Audio getter forwards the single React-owned mixer; weather budget calculates from the existing bounded array. Browser-only rAF ring holds max 240 samples and is stopped at soak end.

`tests/e2e/t06f-soak.spec.ts` includes platform/Node/CPU model/logical cores/memory, browser user-agent, seed, population, speed, viewport, weather, tick, actual elapsed milliseconds and each measured metric. If `performance.memory` is absent, field stays null (**NOT MEASURED**). CPU utilization and GPU frame-duration instrumentation do **not** exist, therefore **NOT MEASURED**.

## 96×96 / 100 NPC baseline
Past `E04_F_PERFORMANCE.md` reported Linux Node 36-hour simulation tick p95 = 16.699–40.201 ms across seed/weather configurations. Past `W02_F_PERFORMANCE.md` contains headless Chromium snapshots. These were recorded on **older commits**, not a matched T06-F baseline, and **cannot** establish a before/after speedup or resource retention trend.

| Metric | Before T06-F matched run | After T06-F matched run | Status |
| --- | --- | --- | --- |
| Phaser average FPS / deltas | no matched sample | no matched sample | NOT MEASURED |
| rAF p50/p95 | no matched sample | new 240-frame bounded sampler available, no run | NOT MEASURED |
| JS heap / CPU utilization | no matched sample | nullable heap instrumented; CPU not instrumented | NOT MEASURED |
| GameObject / texture count | prior `observerPerf` getter exists | getter unchanged, no real sample | NOT MEASURED |
| Ambient, weather, audio | existing visual/scheduler and WeatherAudio mock counters | weather/audio now queryable through same dev getter | PARTIAL (instrumentation only) |
| 5/30/60/120 minute trends | none on branch | runner opt-in, no real execution here | NOT RUN |

No performance fix was claimed without before/after metrics. The coordinator lease change fixes correctness under multiple live consumers, not verified FPS.

## Reproducible matched comparison
Run `npx playwright test tests/e2e/e04f-integration.spec.ts -g "live browser frame"` against the merge baseline and candidate using the **same PC, Chromium version, viewport, seed, population, weather, pace and capture window**. Collect at least three repetitions separated by cooldown/GC annotation. Compare median/p95 and counts with confidence/variability notes. Document actual CPU/GPU identity for physical PC. Explicitly avoid concluding a leak from any single heap rise.

**Overall performance acceptance: PARTIAL / NOT MEASURED**, pending actual Windows/browser measurement.
