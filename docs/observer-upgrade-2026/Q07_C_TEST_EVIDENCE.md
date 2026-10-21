# Q07-C test evidence

Dependency verification (2026-10-21): main `e5df78b4b2729deb0583b2e74e383ec47123eef1`; PR #49 merged; [post-merge CI #39571875473](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39571875473) completed/success on that exact SHA.

| Check | Status | Evidence |
|---|---|---|
| New Q07-C camera geometry tests | PENDING CI | `src/game/camera/q07c.cameraQA.test.ts`; 96/48 maps, desktop 1366x768/1920x1080/3440x1440; Vitest; no real camera input |
| Reused camera / AFK suites | PENDING CI | `src/game/camera/cameraMath.test.ts`, `afkDirector.test.ts` |
| Source review terrain, layout, lighting and weather | REVIEWED source only | WorldScene, terrain.ts, world96Layout.ts, lighting.ts, weatherVisuals.ts |
| Fast CI npm ci / production audit / typecheck / lint / Vitest / build | PENDING final-head CI | GitHub Actions pull_request checks |
| Direct local npm | NOT RUN | Terminal unable to resolve github.com; local checkout/dependencies unavailable |
| Browser, snapshots, canvas pointer, audio, OS/device | NOT RUN | No real captured artifact; screenshots/videos none |
| FPS, p95 frame, heap, GPU, memory | NOT MEASURED | Q07-E owns profiling |
| 20–30 minute observer viewing, long soak | NOT RUN | Q07-D / Q07-E |

Case data: Q07-normal-life seed 101 population 20 map 96x96 tick 0; Q07-camera-follow-death seed and tick from Q07-A fixture manifest; viewport matrix as above; speed 1x; observer pace must be recorded separately if used. Observed tick: NOT RUN manual. Actual interaction: NOT RUN. Exact final PR HEAD, CI URL and completion must be appended in handoff or PR verification; pre-merge CI cannot certify the final branch without an exact SHA match.
