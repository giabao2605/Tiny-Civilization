# E04-F — Performance & memory profiling

## Measurement protocol

Keep three environments separate; **no performance result for E04-F is asserted here before a run completes**.

| Environment | Signals available | Evidence status |
|---|---|---|
| Node.js / Vitest | per-hour simulation tick P50/P95, 36-hour route requests, BFS and weighted path counts, total wall time | NOT RUN for E04-F; source instrumentation committed |
| Headless Chromium / Playwright | rAF browser frame P50/P95/mean, Phaser game-loop FPS/delta, renderer type, scene objects/textures, route delta, heap if supported | NOT RUN for E04-F; browser test available |
| Local physical Windows PC | 1366/1920/2560 viewports, GPU-dependent real FPS, audio, memory/texture growth, 60–120m soak | NOT RUN; requires owner/operator PC execution |

**Metric rules:** `rAF` measures callback spacing and is not GPU draw time; Phaser FPS is a separate measurement. JavaScript heap can be missing or GC-dependent; report `null`/NOT MEASURED if unavailable. No fake FPS, hardware specifications or leak-free conclusion. Route counts are instrumentation counters, not per-NPC path decisions. Never compare Node tick throughput directly with browser rendering performance.

## Reproducible short-profile matrix

- Two maps (48×48 valid migrated v5, 96×96 authored v6), each with 20/50/100 NPC.
- Main viewport 1366×768 across all six combinations; additional 1920×1080 and 2560×1080 for 96×96 with 100 NPC (eight samples total).
- A real unpaused 20× simulation during each browser rAF/Phaser sample. Legacy and Observer speed UI choices are exercised in a separate browser integration test.
- Weather seed 1 initially gives rain; non-rain visuals are exercised in the 24-case screenshot matrix.
- Map load time is not yet instrumented end-to-end: **NOT MEASURED**. Do not use a screenshot timer as a loader benchmark.

## Real 60/90/120-minute soak

Optional test `tests/e2e/e04f-soak.spec.ts` requires `E04F_SOAK_MINUTES=60|90|120`. It uses real elapsed wall time (not fake time), 96×96, 100 NPC, initial rain seed 1, 1× and periodic five-minute captures. Test timeout scales with requested duration and is intentionally incompatible with the hosted Full E2E 35-minute job. Run on PC using the command in E04_F_IMPLEMENTATION.md.

Soak checks for one canvas, runtime errors, saved v6 and progression, and logs weather, route counts, heap, game objects/textures. GC, browser GPU drivers and listener leak analysis require human review of trends and optionally the DevTools Memory profiler. Increased objects may represent legitimate buildings/population; not every increase proves a leak. No numeric threshold has been claimed.

## Results

**E04-F baseline:** NOT RUN/NOT MEASURED at authoring. Read the actual current PR workflow logs and any `E04F_NODE_MATRIX`, `E04F_CHROMIUM_PROFILE`, or `E04F_SOAK` JSON. Record exact commit SHA, duration, browser/CPU/GPU, FPS quantiles and memory values before updating this file to PASS/PARTIAL.
