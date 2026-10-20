# T06-B — Performance baseline and measurement status

## Reference only (T06-A historical, NOT T06-B improvement)
Main `6b44a6f` post-merge Fast CI #39390044744 PASS (48 files, 400 Vitest tests). T06-A Ubuntu/Node simulation baseline recorded 96×96/100 NPC seed 3: tick p95 **33.535 ms** on one run; seed 12345: tick p95 **15.739 ms**, max **41.506 ms** on another. Different samples and runner conditions, so do not compute a speedup from these. T06-A published a 48/96 × 20/50/100 test matrix and a reproducible 72-tick Node benchmark.

## Candidate T06-B
New opt-in instrumentation is in the code and can be measured with a fixed-seed replay. New candidate Node timing data must come from the Fast CI logs of its final commit, with matching runtime/runner and explicit sample parameters. **T06-B Node benchmark final-head values: NOT MEASURED pending exact final-head CI extraction.** No performance regression/improvement claim can be made yet.

## Real browser / PC
- Chromium E2E: **NOT RUN** in this assistant environment; Fast CI intentionally does not run Playwright.
- Real browser Phaser FPS, frame p95 and graphics cost: **NOT MEASURED**.
- Windows physical process CPU/RAM/heap leak trend/GC and 60/120-minute soak: **NOT MEASURED**.
- Headphones/speakers audio audibility: **NOT RUN**; audio mock tests cannot substitute.
- Tested OS/Node/browser/viewport for a Windows baseline: **NOT RECORDED**; no physical PC test.

## Windows measuring recipe
At the exact candidate SHA, use Node 22/npm 10, `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`, then `powershell -ExecutionPolicy Bypass -File .\\scripts\\observer-benchmark.ps1`. Start `npm run dev` with `?observerPerf=1` and sample `window.__tcObserverFullMetrics()`; record seed/map/population, 1366×768/1920×1080, camera fit/follow, 1×/5×/20×/observer, weather/ambient/diagnostics ON/OFF, CPU/GPU/RAM/Windows build/Chromium version. A 48×48 map requires a legitimate legacy save/fixture, not a fake 48×48 reset. Record stable-duration and warmup/wall time; samples are not "measured" until run.
