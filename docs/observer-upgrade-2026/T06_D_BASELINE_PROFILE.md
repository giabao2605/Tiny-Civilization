# T06-D baseline profile

Dependency: exact main `00e8706998d3c55d195ad06242ad1eb3c01d7b46`, Fast CI #39399807790 SUCCESS. Node fast CI baseline on unchanged engine commit `cdd16e0a99d01211e88a41f027ed5efaed18b256`, [CI #39529797892](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39529797892) SUCCESS, Node v22.23.3 Linux x64:
| Map | NPC | Seed | Tick p50 ms | Tick p95 ms | Max ms | BFS calls/72 ticks | Save bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 48x48 | 50 | 12345 | 0.222 | 0.812 | 1.589 | 1838 | 134211 |
| 48x48 | 100 | 12345 | 0.528 | 1.246 | 2.482 | 3465 | 220105 |
| 96x96 | 50 | 12345 | 0.940 | 4.957 | 10.606 | 1524 | 253870 |
| 96x96 | 100 | 12345 | 1.803 | 13.322 | 24.449 | 3067 | 375275 |

Numbers are measured 72-hour Node/Vitest CPU simulation, not FPS, and the 48 map is a legitimate legacy fixture path in the existing baseline test. Heap readings were GC-sensitive; not leak certification.

Source audit: terrain and road overlays are already single generated textures; decorative forest images persist for the entire map regardless of camera zoom. Weather rain has a bounded descriptor pool capped at 112 and draws only within the viewport. Ambient actors are camera-aware. Existing UI snapshots batch every 1,2,4 canonical ticks by 1x/5x/20x. Do not duplicate existing caches or clocks.

The `T06-D Headless Browser Profile` workflow captures browser baseline on the **exact unmodified main** checkout, then same-test candidate on the same Ubuntu runner, Chromium version recorded. Matrix: new 96x96 map, 100 NPC, seed 12345, speed 1x/20x, fit/zoom/follow, effects ON/OFF, viewport 1920x1080; 3 warmed samples per case. Browser FPS/tick/particle/heap values before success: **PENDING**. Genuine v5 48x48 import has a separate browser correctness test, not yet a full FPS matrix. Real Windows PC/1920+1366 comparison, audio and soak: **NOT MEASURED**.
