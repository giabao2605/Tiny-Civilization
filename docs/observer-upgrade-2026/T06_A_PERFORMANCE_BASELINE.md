# T06-A — Performance baseline and reproducible measurement protocol

**Data provenance:** inspected **full job log** of [main CI #39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907) at `4561660af5c55179df90b73e0d41e5f14b75eede`. These values are **MEASURED Node/Vitest times** from 2026-10-20, **not** Windows FPS/CPU utilization/working-set RAM. CI hardware: GitHub hosted ubuntu-24.04, Node v22.23.3, AMD EPYC 7763 (reported). npm version not in log. Benchmark order, JIT and GC affect absolute values.

## Measured current-main seeded 48/96 matrix

Existing `E04F_NODE_MATRIX` printed 48 and 96 maps x 20/50/100 NPC x four seed/weather fixtures (1 rain, 2 clear, 3 cloudy, 8 fog), each 72 canonical hours. Representative **seed 2 (clear)** below. Each entry comes from matching `size`/`population`/`records[].seed` on the **same CI run**.

| Map | NPC | Tick p50 ms | Tick p95 ms | BFS calls first 36h | Weighted calls first 36h |
|---|---:|---:|---:|---:|---:|
| 48×48 | 20 | 0.241 | 0.551 | 388 | 0 |
| 48×48 | 50 | 0.390 | 1.209 | 972 | 0 |
| 48×48 | 100 | 0.760 | 1.957 | 1890 | 0 |
| 96×96 | 20 | 0.831 | 6.514 | 358 | 77 |
| 96×96 | 50 | 2.126 | 17.465 | 904 | 192 |
| 96×96 | 100 | 3.724 | 32.505 | 1848 | 398 |

Worst representative **seed 3 / 96×96 / 100 NPC** p95 was **33.535 ms**, based on this different sample; no extrapolation to 60 FPS. These are CPU simulation timings inside CI, NOT the main-thread cost of painting frames.

Second existing controlled profile: `W02-F-NODE-METRICS`, **96×96**, seed 12345, 48 ticks (independent sample):

| NPC | tick p50 / p95 (ms) | BFS path calls/tick p50 / p95 | Save bytes | Parse ms | Serialized ms |
|---|---|---|---:|---:|---:|
| 20 | 0.926 / 5.566 | 8 / 21 | 165895 | 16.154 | 11.563 |
| 50 | 1.872 / 10.106 | 21 / 51 | 233341 | 8.554 | 6.404 |
| 100 | 3.628 / 21.514 | 33 / 101 | 329504 | 11.518 | 12.340 |

These per-save sample sizes are under the existing **8 MiB** cap; they are not maximum-save-size proofs. `W02-E-METRICS` independently covers v6 96×96 one-tick generation/parse/save. `PHASE06_PERFORMANCE` covers 48×48 tiers, 1000 hours per tier. Logs already support useful first-pass comparisons.

## T06-A added repeatable read-only Node benchmark

`src/sim/t06a.baseline.test.ts`: each of 48/96 x 20/50/100 x **seeds 101 and 12345** executes **72 real engine ticks**, reports `T06A_NODE_BASELINE` with seed, p50/p95/**max** tick ms, BFS calls, serialization/parse ms, JSON bytes, heapUsedBytes. Assertions protect tick count, saved roundtrip/projection, and finite nonnegative timings. No frame pacing, gameplay RNG or schema edits; no absolute wall-time PASS thresholds. **New-run results must be taken from final candidate CI logs; do not fill from base metrics.**

To repeat candidate Node baseline:

```powershell
git checkout <exact-candidate-SHA>
node --version; npm --version
npm ci
npx vitest run src/sim/t06a.baseline.test.ts --reporter=verbose
```

`max` will only become **MEASURED** when this test runs; base-main historic benchmarks did not log max tick time for the matrix above.

## Real PC/Chromium baseline protocol (not executed here)

Use a fixed Windows PC with model+CPU+GPU+RAM, plugged-in power mode, monitor refresh, resolution, Windows build, Node/npm versions and Chromium `chrome://version` saved. Match same commit/seed/simulation pace/weather/viewport, close competing GPU workloads, disable overlays; 3 runs per cell with warmup.

```powershell
git checkout <exact-candidate-SHA>
npm ci
npx playwright install chromium
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
powershell -ExecutionPolicy Bypass -File .\scripts\observer-benchmark.ps1
npm run dev -- --host 127.0.0.1
```

Start app with `?observerPerf=1` for DEV-only `__tcObserverMetrics()` (actual Phaser FPS, frame delta, game objects, textures, routing/ambient counters); `?weatherParticles=off` or `?ambientVisuals=off` can isolate cosmetics without editing gameplay. Use `tests/e2e/observer-w02-f-perf.spec.ts` for 96×96 population/viewport and `observer-v01-e-perf.spec.ts` for 20/50/100 x speeds x viewports/camera; manually inspect screenshot evidence and confirm actual rendered category counts. Test 48×48 through *real legacy v5 import* (no fake 48 reset), and 96×96 new world.

**Suggested matrix:** 48 & 96 x NPC 20/50/100 x seed 101/12345 x 1366×768 / 1920×1080 / ultrawide, with fit, follow, zoom and AFK representative runs. Record weather, ambience/audio ON/OFF, paused/1×/20×, scene count/objects/textures, rain/ambient actor budget, rAF frame time median/p95 and FPS, tick p50/p95/max, path calls, process CPU/RAM (Task Manager/Performance Monitor sampling; label process and tool), save bytes + load/parse p95, and snapshots at 0/15/60min. Browser JS heap may be unavailable; record null, not zero. Report 5–10min steady state before 60/120min soak. Windows audio audibility/left-right must be listened to, not inferred from simulated AudioContext tests.

| Metric | Current T06-A status | Why |
|---|---|---|
| Node tick p50/p95; pathfinding count; 96 save bytes/parse | **MEASURED** | GitHub main CI above |
| Node tick **max** in new T06-A test | **NOT MEASURED until final PR CI** | New test requires execution |
| Phaser FPS, frame p95, graphics/texture/particle budget | **NOT MEASURED** | No real browser run in this task |
| Windows CPU/RAM, process working-set growth, long soak | **NOT MEASURED** | No physical Windows measurements |
| Actual Chromium E2E and PC audio | **NOT RUN** | Manual browser workflow not invoked |
| Headless browser runs from previous PRs | **Historical only** | Do not mix with current matched baseline |

**Warning:** A measured Node heapUsed sample is GC-sensitive and **not evidence of a memory leak or leak-free application**. Baseline supports profiling decisions, not optimization claims.
