# A05-E — Performance Profiling & Resource QA

**Environment available during implementation:** GitHub repository connector and Fast CI workflow. The execution environment for this task could read/edit GitHub but could not clone the repository over the container network or launch a local Vite/Chromium/PC listening session. Do not infer PC FPS from CI passes.

| Measurement | A05-E result | Status |
| --- | --- | --- |
| Source change: one short filtered list instead of an intermediate per-frame Map | Confirmed source diff; no timed allocation sample | PARTIAL |
| Existing `?observerPerf=1` Phaser telemetry | gameObjects, textureCount, Phaser actualFps, frameDeltaMs, ambient metrics, routing counters from prior work | Available; NOT MEASURED for A05-E |
| New distinct rendered categories/types | Bounded by catalog; only updated after real graphics creation, no WorldState writes | Implemented; live values NOT MEASURED |
| Browser rAF p50/p95, FPS and CPU | No A05-E browser run | NOT MEASURED |
| JS heap delta, graphics/texture/particle count evolution | No A05-E soak | NOT MEASURED |
| Audio voice/loop count evolution | A05-D mock tests and diagnostics; no sustained physical run | NOT MEASURED |
| 5/20-30/60/120-minute elapsed-real-time sessions | Optional new 5-minute Playwright authored but not executed; no 60/120 soak | NOT RUN |
| Before/after **matched** A05-D → A05-E FPS comparisons | No matched measurements, no performance improvement claim | NOT MEASURED |

## Prior historical evidence, not an A05-E benchmark
`W02_F_PERFORMANCE.md` reports older headless Chromium rAF and object/texture measurements for 48/96 worlds and three PC viewports. `E04_F_PERFORMANCE.md` reports 36-hour **Node simulation** tick p50/p95 for different maps/weather, with 100-NPC/96x96 p95 tail up to tens of milliseconds in that runner. They are **earlier commits, different workloads and not valid A05-E before/after results**. No new numbers are copied as if observed in this task.

## Required reproducible matrix
- Historical v5 48×48, migrated v6 48×48, native v6 96×96; 20/50/100 citizens.
- Weather clear/cloudy/rain/fog; dawn/day/dusk/night, legacy 1×/5×/20× and Observer Pace 5/10/15; paused, hidden/resumed, active.
- Fit/pan/zoom/follow/AFK; 1366×768, 1920×1080, 2560×1080; audio off/on/muted; import/reset/remount.
- Representative pairwise samples are sufficient, but exact seed, device, operating system, browser, active flags and weather must be logged. Do not call the Cartesian product completed.

## How to obtain data
```bash
npm ci
npx playwright install chromium
npx playwright test tests/e2e/a05e-watchability.spec.ts
npx playwright test tests/e2e/e04f-integration.spec.ts -g "live browser frame"
E04F_SOAK_MINUTES=60 npx playwright test tests/e2e/e04f-soak.spec.ts
```
The 60-minute soak requires a suitable local PC and a terminal that supports setting that environment variable (PowerShell: `$env:E04F_SOAK_MINUTES="60"`). Read/write snapshots at multiple elapsed times, report rAF cadence vs Phaser FPS separately and inspect console, created minus destroyed actors, heap trend and audio diagnostics. Single heap samples do not prove leak-free operation. The optional Playwright 5-minute test writes a JSON file and screenshots to its test output directory.

## Optimization decision
No renderer/simulation rewrite, capacity increase, dynamic texture factory or extra particle system was justified without measured evidence. The bounded array-allocation reduction is a low-risk local change; any numeric performance conclusion waits for a matched profile.