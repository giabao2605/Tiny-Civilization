# T06-B — Performance baseline and measurement status

## Reference only (T06-A historical, NOT T06-B improvement)
Main `6b44a6f` post-merge Fast CI #39390044744 PASS (48 files, 400 Vitest tests). T06-A Ubuntu/Node simulation baseline recorded 96×96/100 NPC seed 3: tick p95 **33.535 ms** on one run; seed 12345: tick p95 **15.739 ms**, max **41.506 ms** on another. Different samples and runner conditions, so do not compute a speedup from these. T06-A published a 48/96 × 20/50/100 test matrix and a reproducible 72-tick Node benchmark.

## Candidate T06-B
**MEASURED in code-validation [Fast CI #39392870084](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39392870084), exact code SHA `0aa4db318d0c6a9069deed7cc29b9644e91b060c`.** Hosted Ubuntu/Linux x64, Node v22.23.3, GitHub runner. Existing `T06A_NODE_BASELINE` deterministic 72-tick fixture with seeds 101/12345 (new test implementation is independent of this benchmark). All numbers are Node/Vitest CPU simulation durations, **NOT** browser frame rates or actual GPU/OS memory metrics.

| Map | NPC | Seed | tick p50 ms | p95 ms | max ms | BFS/72 ticks | Save bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| 48×48 | 20 | 101 | 0.563 | 2.491 | 6.963 | 710 | 76241 |
| 48×48 | 20 | 12345 | 0.248 | 0.985 | 2.445 | 721 | 75750 |
| 48×48 | 50 | 101 | 0.688 | 1.687 | 2.733 | 1810 | 132549 |
| 48×48 | 50 | 12345 | 0.712 | 1.775 | 2.788 | 1838 | 134211 |
| 48×48 | 100 | 101 | 1.326 | 2.952 | 4.779 | 3412 | 219510 |
| 48×48 | 100 | 12345 | 1.030 | 2.128 | 3.172 | 3465 | 220105 |
| 96×96 | 20 | 101 | 1.103 | 3.440 | 17.234 | 487 | 173034 |
| 96×96 | 20 | 12345 | 0.865 | 6.708 | 32.146 | 568 | 177653 |
| 96×96 | 50 | 101 | 2.431 | 7.038 | 14.809 | 1143 | 236842 |
| 96×96 | 50 | 12345 | 1.934 | 9.385 | 20.838 | 1524 | 253870 |
| 96×96 | 100 | 101 | 3.087 | 15.025 | 20.479 | 2291 | 332362 |
| 96×96 | 100 | 12345 | 3.875 | 16.879 | 52.189 | 3067 | 375275 |

Additional new-run `E04F_NODE_MATRIX` 96×96/100 NPC seed 3 (72 ticks) had **tick p95 38.812 ms**; T06-A historical seed 3 was **33.535 ms** on a different CI run. Node seed 12345/96×96/100 benchmark here measured **p95 16.879 ms, max 52.189 ms**; historical seed 12345 was **p95 15.739 ms, max 41.506 ms** in a different 48-tick fixture. **Do not infer regression/improvement:** measurements use different runs and in the latter comparison different tick windows, warmup/JIT/GC and unknown matched hardware scheduling. This PR adds profiling, no tick optimization.

Fast CI for code SHA `0aa4db31` passed npm ci, audit, typecheck, lint, Vitest **49/49 files, 421/421 tests**, build. A subsequent documentation-only commit still needs CI validation on its exact final HEAD.

## Real browser / PC
- Chromium E2E: **NOT RUN** in this assistant environment; Fast CI intentionally does not run Playwright.
- Real browser Phaser FPS, frame p95 and graphics cost: **NOT MEASURED**.
- Windows physical process CPU/RAM/heap leak trend/GC and 60/120-minute soak: **NOT MEASURED**.
- Headphones/speakers audio audibility: **NOT RUN**; audio mock tests cannot substitute.
- Tested OS/Node/browser/viewport for a Windows baseline: **NOT RECORDED**; no physical PC test.

## Windows measuring recipe
At the exact candidate SHA, use Node 22/npm 10, `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`, then `powershell -ExecutionPolicy Bypass -File .\\scripts\\observer-benchmark.ps1`. Start `npm run dev` with `?observerPerf=1` and sample `window.__tcObserverFullMetrics()`; record seed/map/population, 1366×768/1920×1080, camera fit/follow, 1×/5×/20×/observer, weather/ambient/diagnostics ON/OFF, CPU/GPU/RAM/Windows build/Chromium version. A 48×48 map requires a legitimate legacy save/fixture, not a fake 48×48 reset. Record stable-duration and warmup/wall time; samples are not "measured" until run.
