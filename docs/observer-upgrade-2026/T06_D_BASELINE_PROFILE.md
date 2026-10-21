# T06-D — Baseline and measurements

Baseline dependency: exact `main@00e8706998d3c55d195ad06242ad1eb3c01d7b46`. Historical 72-tick Node/Vitest baseline, Linux x64 Node 22.23.3, seed 12345, from Fast CI #39529797892 on unmodified authoritative engine:

| Map | NPC | Tick p50 (ms) | Tick p95 (ms) | Tick max (ms) | BFS /72 ticks | Save bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 48×48 | 50 | 0.222 | 0.812 | 1.589 | 1838 | 134211 |
| 48×48 | 100 | 0.528 | 1.246 | 2.482 | 3465 | 220105 |
| 96×96 | 50 | 0.940 | 4.957 | 10.606 | 1524 | 253870 |
| 96×96 | 100 | 1.803 | 13.322 | 24.449 | 3067 | 375275 |

48×48 fixtures are genuine legacy model paths, not 96×96 maps resized in the renderer. These numbers are CPU simulation durations, not FPS; they do not prove the renderer improved.

**Historical browser evidence, before owner-requested de-scope:** optional [paired Chromium workflow #39531644418](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39531644418) SUCCESS, baseline main and candidate on one Ubuntu runner. 36 rAF samples per source under 96×96, 100 NPC, seed 12345, camera Fit/zoom/follow, effects on/off, 1×/20×. Aggregate median rAF sample FPS was 4.26 on both baseline and candidate; median frame p95 was 250 ms on both. This is headless CI under contention and **not actual PC FPS**. No improvement percentage is asserted. Workflow and its browser tests are intentionally removed now.

Local PC actual FPS, GPU memory, Windows audio and soak remain NOT MEASURED, outside the revised T06-D gate.
