# W02-F — Performance Baseline and Verification

**Status:** BASELINE & CANDIDATE GitHub Actions CI PASS. Final screenshot-preservation/extended-profile CI remains PENDING. Performance on physical Windows PC: **NOT RUN / PARTIAL**. No 60-FPS certification.

## Fixed evidence and methodology

W02-E exact `main@eb0a4d503f0124267e298443d6fd839c5d64de12` post-merge GitHub Actions [#38995262805](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262805) recorded `V01-E renderer profile` from a 96×96 production React/Phaser app (`?observerPerf=1`), Ubuntu hosted runner, headless Chromium, seed 12345, camera Fit, per-cell 480ms rAF sample; JS heap snapshot from Chrome CDP. Hardware and GPU can vary between Actions runners. Numbers are rAF estimates, **not native physical FPS certification**.

| NPC | Speed | 1366×768 FPS / p95 ms | 1920×1080 FPS / p95 ms | 2560×1080 FPS / p95 ms |
|---:|---:|---:|---:|---:|
| 20 | 1× | 38.45 / 66.8 | 19.86 / 100.1 | 20.35 / 100.0 |
| 20 | 20× | 16.50 / 100.0 | 12.61 / 116.6 | 10.54 / 133.4 |
| 50 | 1× | 34.25 / 100.0 | 19.52 / 116.6 | 18.68 / 116.6 |
| 50 | 20× | 12.60 / 133.3 | 10.70 / 150.0 | 8.93 / 150.0 |
| 100 | 1× | 31.04 / 116.7 | 18.20 / 150.0 | 16.40 / 150.0 |
| 100 | 20× | 7.05 / 216.6 | **5.63 / 300.0** | 8.09 / 283.3 |

At 1920×1080/Fit, baseline GameObjects: **424/457/512** for 20/50/100 NPC; texture counts **43/73/123**, respectively. W02-E sample JS heap at 100 NPC / 20× /1920×1080 was **60,465,036 bytes** (~57.7 MiB), a single observation, not peak or leak diagnosis.

**Important:** Legacy V01-E suite has no 5×, no small-viewport metric. W02-F new 36-case matrix was added on PR #21 before any production changes; compare to subsequent candidate run on the same hosted runner class but do not pretend identical physical hardware or engine tick count. Pending baseline run: [#38997723836](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38997723836).

## Node generation / save baseline (source W02-E post-merge CI)

Single-tick diagnostic `W02-E-METRICS` was captured for seed 103, Ubuntu Node 22 with cold/warm variance:

| NPC | Generation ms | One tick ms | Serialize ms | Parse ms | Save UTF-8 bytes |
|---:|---:|---:|---:|---:|---:|
| 20 | 78.82 | 3.52 | 10.74 | 12.55 | 133600 |
| 50 | 52.42 | 1.02 | 12.87 | 7.14 | 158488 |
| 100 | 59.54 | 0.89 | 5.87 | 6.85 | 200021 |

These are different seeds/iteration lengths from the W02-F 48-tick profile; **do not directly claim speedups between those figures**. Save is well below existing 8 MiB cap in these three samples. W02-F logs also include pathfinding calls/tick and node p50/p95.

## Reproducible before / after W02-F candidate

- **Before** `45725a8ca03738f82563948e7aeafce4aa128753`: [CI #38997723836](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38997723836) **PASS** on production-unmodified W02-E with only measurement tests.
- **After** `33c30011a51041418e1f5c6b905836773cfba1ec`: [candidate CI #38999049391](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38999049391) **PASS**, including 214+ prior tests, frozen v5 SHA/replay, BFS exact route parity, 36 Chromium metric cases, real W02-F visual screenshot tests, full E2E, build, production smoke.
- Common seed 12345, world 96×96, same browser test and 450ms rAF cap, viewport outside browser content area as labeled, camera Fit. Different GitHub-hosted runs and sequential tick drift. Each 20×/100 NPC capture has only 4–5 frame samples and CANNOT certify PC/GPU FPS. Two small apparent regressions are described below.

### Chromium FPS and frame p95, 1920×1080 / Fit

| NPC | Speed | Before FPS | After FPS | Before p95 ms | After p95 ms |
|---:|---:|---:|---:|---:|---:|
| 20 | 1× | 21.79 | 21.87 | 83.4 | 83.4 |
| 20 | 5× | 18.96 | 19.91 | 99.9 | 83.3 |
| 20 | 20× | 13.52 | 17.58 | 100.1 | 83.4 |
| 50 | 1× | 21.24 | 21.26 | 100.0 | 83.3 |
| 50 | 5× | 17.73 | 18.72 | 116.7 | 100.0 |
| 50 | 20× | 11.55 | 15.02 | 133.3 | 100.1 |
| 100 | 1× | 18.70 | 20.12 | 133.2 | 100.0 |
| 100 | 5× | 14.98 | 16.59 | 133.3 | 116.6 |
| **100** | **20×** | **7.10** | **10.15** | **216.6** | **166.6** |

Of all 36 population × speed × 4 viewport cases, **34 showed a higher measured mean FPS and 2 showed lower**: 100 NPC/1×/2560×1080 went 21.18→19.35 (-8.6%); 100 NPC/5×/1366×768 went 24.38→22.94 (-5.9%). These isolated 450ms CI samples are too noisy to establish a regression conclusively. Re-test on a physical PC and with longer capture before release certification; do not claim across-the-board improvement. The 100 NPC/20×/1920×1080 mean improved ~43% within these samples.

### Object, texture, simulation and save metrics

At Fit, display-list counts before→after: **20 NPC 424→393; 50 NPC 457→426; 100 NPC 512→481**. Texture count: **20 NPC 43→24; 50 NPC 73→24; 100 NPC 123→24**. The ~31 fewer display objects primarily reflect batched entrance marks; delayed ID Text textures account for the population-dependent texture drop. Zoom-in label/re-mount E2E PASS in candidate CI.

At 100 NPC, 48 ticks, seed 12345 (Node CI, same test input):

| Node metric | Before | After |
|---|---:|---:|
| Tick p50 ms | 14.196 | 1.557 |
| Tick p95 ms | 120.824 | 11.861 |
| Pathfinding calls/tick p50 / p95 | 33 / 101 | 33 / 101 |
| Map generation ms | 45.661 | 13.605 |
| Save serialization ms | 16.513 | 7.262 |
| Save parsing ms | 6.883 | 7.216 |
| JSON UTF-8 save bytes at tick48 | 329381 | 329381 |

Tick speed and generator results include runtime variance and JIT; do not interpret them as a guaranteed 90% improvement on all hardware. Path route identity is verified directly against frozen old BFS on both v5 48×48 and v6 96×96 with 24 source→destination pairs each; `W02-F-PATH-A-B` on candidate CI logged old/new route search time **18.401/5.057ms (48)** and **31.962/1.573ms (96)** in the single-process diagnostic. Path calls did **not** change, so there is no RNG/behavior shortcut.

CDP JS heap snapshot at 100 NPC/20×/1920×1080: 29,481,872 → 29,871,204 bytes in the short W02-F matrix, not a meaningful leak signal. The earlier W02-E suite sampled 60,465,036 bytes in a separate run; snapshot heap fluctuates substantially and no 60–120-minute Windows soak has been done.

### Remaining measurements and acceptance

- New additional ~4-second 100 NPC/20× 1920×1080 run: **PENDING final-head CI**, because the short 450ms capture is noisy.
- One-time first canvas-ready wall-clock diagnostic: included in candidate E2E JSON but includes Vite/asset load and layout, not pure renderer GPU time. Must not treat as standalone GPU initial-frame timing.
- 36-case full JSON: `W02-F-BROWSER-METRICS` in both workflow logs and `w02-f-viewport-matrix.json`; new artifact-preservation step will keep W02-F measurements before production smoke clears `test-results`.
- Existing camera remount/NPC click/follow, deterministic replay, legacy SHA/save tests: **PASS in candidate CI**; repeat on final HEAD.
- Physical Windows 60–120-minute soak, sustained GPU/FPS and heap, hardware renderer and manual PC playtest: **NOT RUN / PARTIAL**. No claim of steady 60 FPS. See [Windows smoke protocol](W02_F_WINDOWS_SMOKE.md).

Overall: automated correctness **PASS on candidate**; final-HEAD evidence and hardware acceptance **PARTIAL/PENDING**. Only owner-reviewed, CI-proven W02-F may be merged. Plan 03 N03-A requires owner acceptance of remaining Windows risks.
