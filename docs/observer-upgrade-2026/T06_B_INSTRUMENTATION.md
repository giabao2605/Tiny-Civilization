# T06-B — Instrumentation specification

## Ownership and definitions
| Source | Metric (unit) | Semantics |
|---|---|---|
| Coordinator `observerMetrics` | `tickP50Ms`, `tickP95Ms`, `tickMaxMs` (ms) | Last at most 128 `advanceOneTick` synchronous durations, high-resolution `performance.now()` outside engine |
| Coordinator | `tickCount`, `ticksPerWallSecond` (ticks; ticks/s) | Observed ticks since enable/reset; (count−1)/wall interval between first and last completed ticks; **includes paused gaps** |
| Coordinator | `lastTick`, `routingTotals` (calls) | Deltas of already-existing routing `calls`, BFS, weighted A*, BFS fallbacks around authoritative tick |
| Coordinator | `uiPublishes`, `publishGapP50Ticks`, `publishGapP95Ticks` (notifications; ticks) | `notify()` includes UI commands; zero-gap notifications are valid |
| Phaser Game STEP | `frameP50Ms`, `frameP95Ms`, `frameMaxMs`, `frameSampleCount` | Last at most 120 actual Phaser loop `delta` values, not GPU timing; `phaserFps` from Phaser's reported `actualFps` |
| Phaser scene | `gameObjects`, `textureCount`, `sceneCreates`, `sceneShutdowns`, `sceneRestarts` | Scene direct object list, global texture cache, per-instance lifecycle counts |
| Phaser scene | `camera` | mode, zoom, viewport width/height; presentation only |
| AmbientDirector/Visuals | active actors, `createdVisuals`, `destroyedVisuals`, category/type counters | Reused existing bounded cosmetic director/session counters; not proof audio was heard |
| WeatherLayer | `weatherParticles.active/budget/enabled` | Active CPU-drawn rain line segments and deterministic particle pool |
| WeatherAudio | `activeOneShots`, `activeLoops`, `voiceLimit`, `contextState`, `bus` | Number of tracked voices (limit 4), loop sources, real context state if created, selected gain intentions |

## Controls and access
Default OFF. Local development URL: `http://localhost:5173/?observerPerf=1`; a collapsed **Diagnostics DEV** area under the canvas has *Chụp số đo* and *Tắt/Bật metrics*. This captures on demand, without a secondary polling interval. DEV-only browser access:
```js
window.__tcObserverFullMetrics() // { simulation, lifecycle, renderer, audio }
document.querySelector('[data-testid="game-container"]').__tcObserverMetrics()
```
Production builds have no debug UI or sampling hook. OFF resets coordinator's 128-entry statistics and turns off Phaser sampling; pre-existing always-maintained ambient/audio operational counters remain available as passive reads. Scene restarts reset the Phaser frame history with its Game lifetime only, not with coordinator state.

## Sampling/overhead/limits
Timing calls and routing before/after reads occur only if coordinator diagnostics enabled. Each tick incurs a bounded fixed number of reads; percentile sort occurs **on demand** during `read()`. Buffer lengths: 128 tick durations + 128 UI gaps per coordinator, 120 frame deltas per Phaser Game, bounded ambient/voice registries already in A05. No custom performance timer or `Math.random()`, no state/save writes. Absolute observer overhead on Windows **NOT MEASURED**; compare OFF/ON at the same seed/CPU/browser.

`null` means no sample/unsupported: GPU duration, process memory, inactive scene readings, unavailable context. Never reinterpret these as zero, OS CPU/RAM or proof of 60 FPS. Existing cross-world global routing counters require one active measured coordinator for clean attribution.
