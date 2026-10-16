# V01-E — Comparative performance evidence

**Status:** PARTIAL; **CI timings are NOT physical PC FPS**. Use `seed=12345`; 48×48×12 pixels, Chromium on GitHub-hosted Ubuntu runner, 480-ms `requestAnimationFrame` samples, Playwright default worker=1. Baseline and final captured on **different, shared CI runner instances/times**; tickBefore/tickAfter and camera zoom are logged per sample, but the engine world at every sample is **not frozen to the same tick**, therefore these numbers are trend/noise observations, not proof of a causal speedup.

**Artifacts:** baseline [run 38846829650](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38846829650) at `2d7e26ef`, final [run 38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446) at `c1db2c13`. Download `phase-07-release-evidence`, inspect `observer-v01-e-evidence/v01-e-ci-matrix.json` and `v01-e-remount-counts.json`. GitHub artifacts expire (workflow retention 7 days).

## Matched configuration examples, 1920×1080

| NPC | Speed | Camera | Baseline FPS | Final FPS | Baseline p95 ms | Final p95 ms |
| ---: | ---: | --- | ---: | ---: | ---: | ---: |
| 20 | 1× | Fit | 28.55 | 24.11 | 83.4 | 83.4 |
| 20 | 1× | Follow | 19.04 | 15.79 | 100.0 | 100.0 |
| 50 | 1× | Fit | 26.72 | 20.36 | 99.9 | 100.1 |
| 50 | 20× | Follow | 12.48 | 8.44 | 133.3 | 199.9 |
| 100 | 1× | Fit | 22.83 | 20.03 | 116.7 | 133.3 |
| 100 | 1× | Manual-close | 15.60 | 13.56 | 133.3 | 149.9 |
| 100 | 1× | Follow | 16.00 | 12.61 | 150.0 | 150.0 |
| 100 | 20× | Fit | 11.93 | 8.66 | 149.9 | 150.1 |
| 100 | 20× | Manual-close | 9.01 | 8.50 | 166.7 | 183.4 |
| 100 | 20× | Follow | 7.97 | 8.92 | 166.8 | 183.4 |

All **54/54 cases sampled** in both artifacts. Overall arithmetic mean of the per-case FPS: baseline **20.54**, final **17.73**; 4 configurations higher, 50 lower. This is **not a performance PASS**. Short samples, CI contention, scene/tick drift, browser software rendering, and runner variation may affect results. The measured results must not be advertised as an FPS improvement or a hardware benchmark. In an intermediate run at `d87f41b9`, the FPS varied in both directions even with the same code shape. The rejected eight-outfit texture implementation was rolled back; no generic caching claims.

## Resource and lifecycle samples

At 100 NPC, 20×, Follow, 1920×1080: root scene GameObjects **258 → 258**, canvas **1 → 1**, sampled JS heap **62,863,812 → 66,383,736 bytes** (separate runner observations; **not** a leak slope). Scene root GameObject counts omit children inside NPC containers. Six repeated remounts while paused yielded **161 GameObjects** and **43 textures** on every remount on final HEAD; counts are consistent, but a 60–120 minute heap slope or GPU resource leak test was **NOT RUN**. Scene restart on reset/load is covered by existing E2E, not the same as a long soak.

## Windows local-first measurement

PowerShell from a **clean checkout**, no deployment:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/observer-benchmark.ps1 -Install
```

The optional `-Install` runs `npm ci` and installs Playwright Chromium once; subsequent runs omit it. This executes the 54-case matrix with **headed Chromium** on the user's PC and saves JSON under `test-results/**/v01-e-ci-matrix.json`. This is an instrumented browser comparison and might still be limited by driver/GPU acceleration; to certify gameplay, also open `npm run dev` in Chrome at the same seed/preset/zoom and manually record actual FPS/frame timings with Chrome DevTools Performance for 5–10 minute samples, 1× and 20×. Note CPU/GPU, RAM, Windows/Chrome version, GPU acceleration state, refresh rate, device scale factor, FPS p50/p95 and energy/background state. Test Fit vs Manual-close vs Follow at equivalent zoom; avoid attributing Fit/Follow difference entirely to camera motion.

Run a **60–120 minute soak** at 100 NPC × 20× with repeated Fit/Follow/AFK, resize, save/load and six remounts. Record heap at start, +30m, +60m and +120m after comparable idle/GC points; stable one-off heap is not leak proof. Compare baseline `main` and the PR branch using the same PC, browser, seed and setup before accepting performance. Target 60 FPS is an ambition, not a measured result. Do not alter simulation to hit the FPS target in V01-E.

**Acceptance:** CI tests passed; physical-PC frame quality/long soak and an explained repeatable performance improvement are **OPEN / PARTIAL**.