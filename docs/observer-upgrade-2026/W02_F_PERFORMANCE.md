# W02-F — Performance Baseline and Verification

**Status:** Baseline available for W02-E; candidate measurements pending CI. Performance on physical Windows PC: **NOT RUN / PARTIAL**. No 60-FPS certification.

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

## Candidate data and acceptance

- **36-case 5×/small-viewport baseline vs candidate:** PENDING; use logs named `W02-F-BROWSER-METRICS` and corresponding `w02-f-viewport-matrix.json` artifact. Any absent/failed case is explicitly NOT RUN/FAIL, not copied from old V01-E numbers.
- **Node p50/p95 + path calls/tick:** PENDING; use `W02-F-NODE-METRICS`.
- **Path BFS A/B parity/timing on same runner process:** PENDING; use `W02-F-PATH-A-B`. Correctness parity is mandatory; speed comparison is a diagnostic, not a hard flaky pass assertion.
- **Initial rendering/load and texture/GameObjects:** browser artifact + existing creation screenshots; timer-specific initial render instrumentation not yet independently sampled, thus **NOT RUN** as a separate timing metric.
- **Canvas remount/save/hidden-tab/Follow:** existing V01/V02 Chromium tests mandatory, pending final-HEAD CI.
- **Windows 60–120 minute soak, GPU perf, physical FPS, memory stability:** NOT RUN. Certification remains PARTIAL regardless of CI success.

Do not interpret single-run changes as proof of Windows FPS. If candidate loses FPS or a determinism test, rollback and leave W02-F PARTIAL. See [handoff](W02_F_HANDOFF.md).
