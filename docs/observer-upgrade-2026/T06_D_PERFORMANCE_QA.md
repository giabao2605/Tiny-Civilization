# T06-D performance QA and acceptance

- Baseline source: PR #43 merge main@00e87069.
- Candidate tree-culling renderer: static decorative sprite presentation only, no world/engine changes.
- Historical Node CPU evidence: [#39529797892](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39529797892), 96x96/100 NPC seed 12345, tick p50=1.803 ms and p95=13.322 ms; these are not browser FPS.
- Paired browser test in separate `T06-D Headless Browser Profile` workflow: Chromium headless Linux, 36 warmed rAF samples across 12 scenarios, exact baseline and candidate same runner, hardware report. Workload configured afresh before 20x to avoid Playwright camera-click starvation. Results PENDING; do not claim speedup or 60 FPS.
- Diagnostic toggles OFF/ON and two effects variants are presentation-only; benchmark does not change gameplay RNG. Browser profiler with ?observerPerf=1 has sampling overhead and headless hardware can vary, so report source and limits.
- Physical Windows GPU frame time, process CPU/RAM, audio, 60-120min soak: NOT MEASURED. Full 48/96×20/50/100×seeds101/12345×viewport matrix: NOT RUN on browser; Node seeded 48/96 test exists and ran as part of Fast CI. T06-F soak remains deferred.
