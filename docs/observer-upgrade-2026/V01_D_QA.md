# V01-D — QA & Performance Evidence (2026-10-16)

**Task:** Follow NPC / Cinematic AFK, PC local-first observer.
**PR:** [#14](https://github.com/giabao2605/Tiny-Civilization/pull/14), deliberately Draft. V01-C base commit `a0cddcc2`.
**Verified CI:** [38837917119](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38837917119) at `b9c9ecbb` and [38839814189](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38839814189) at `746c87a7`; second run had one Playwright flaky retry. Final HEAD needs fresh CI.
**Artifact:** [phase-07-release-evidence #12019608904](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38837917119/artifacts/12019608904).
**Status:** CI PASS with one flaky E2E retry in run 38839814189; final no-flake CI pending. Overall acceptance PARTIAL. Re-verify this PR's final commit before any merge.

## Checks confirmed by run 38837917119

| Gate | Result |
| --- | --- |
| `npm ci`, production `npm audit` | PASS |
| `npm run typecheck`, `npm run lint` | PASS |
| `npm run test` | PASS: 96 Vitest, 16 files |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS on run 38839814189: 21 Chromium cases, 1 skipped, **1 flaky on first attempt**; timeout crossing test subsequently corrected |
| Pages-path production build, release smoke | PASS: 1 Playwright case |
| PC device FPS / memory over extended runtime | NOT RUN; physical PC required |
| Full acceptance visual QA and extreme edge-of-map / long-run | PARTIAL |

All passing test counts represent the named CI HEAD only, not an untested subsequent commit.

## Actual screenshot review

Reviewed PNG images extracted from the GitHub Actions artifact, not just file presence:
- `v01-d-follow-a.png`: selection marker for NPC #27 is present, UI indicates Follow; initial frame is mid-easing, not settled.
- `v01-d-follow-b-paused.png`: target changes to NPC #28; ring visible, camera is zoomed and the sim HUD says paused. No obvious canvas duplication/art tearing in this frame.
- `v01-d-manual-override.png`: camera readout is `manual`, target highlight remains; viewport stays filled by terrain.
- `v01-d-afk-commons.png` and `v01-d-afk-next-scene.png`: first capture in run 38837917119 was at start of easing; screenshots from run 38839814189 were **actually viewed after 1600ms mock-clock render progression**. They show zoom 1.32× and 1.38×, no obvious screen tearing, and distinct real scene anchors `site:26` then `site:21`. This is evidence of a visible transition, not a guarantee of subjective motion quality on a physical monitor.
- `v01-d-390x844-fit.png`: mobile fallback layout stacks correctly, buttons wrap without evident horizontal overflow. Mobile is ancillary: the goal is PC local.
- 1366×768 and 1920×1080 desktop samples show readable controls and one Phaser map canvas.

Remaining manual observations: settled AFK scenes, boundary focus on a traveling NPC near each map edge, subjective motion smoothness on physical monitor, live tab background/resume, and long-duration renderer memory profiling. These are not claimed PASS.

## Same-run Chromium performance: fit vs follow

Run 38837917119, seed 12345, Chromium headless, 1920×1080. Mean FPS samples measured from requestAnimationFrame, not guaranteed real game FPS or equivalent to a physical PC. Manual mode used *Fit*, with different zoom than Follow, so those two samples do not fully isolate camera-motion overhead.

| NPC | Sim speed | Manual-fit mean FPS | Follow mean FPS | Follow p95 frame (ms) |
| --- | --- | --- | --- | --- |
| 20 | 1× | 43.61 | 29.59 | 66.70 |
| 20 | 20× | 28.73 | 20.67 | 66.80 |
| 100 | 1× | 37.49 | 25.13 | 83.40 |
| 100 | 20× | 21.44 | 16.73 | 100.10 |

Observed Follow is below Manual Fit in all four cases. A follow-up paired `manual-close` sample at a similar zoom has been added to the Playwright benchmark for a fairer same-scale comparison; check the final CI artifact. Memory samples exist per mode in `v01-d-ci-performance.json`, but isolated heap snapshots are insufficient to prove absence of leaks.

## Camera invariants / regressions

- `WorldState` v5 and `src/sim/**` unchanged across PR.
- New paused-state E2E verifies seed/tick/state digest and exported save JSON remain identical before/after camera-only actions.
- Timer uses one cancellable browser timeout; scene listener teardown and old controls require continued lifecycle review.
- AFK disabled by default, hidden-tab and reduced-motion handling covered.
- Do not mark performance 60 FPS or DONE until evidence warrants it.

## Rollback and next gate

Rollback PR #14 alone. Do not merge without independent acceptance. V01-E handles broader render/perf polish **after** V01-D gates are reviewed; never silently treat a CI PASS as acceptance of PC FPS.

## Same-zoom refinement from CI run 38839814189

Comparison at zoom 3× in both `manual-close` and Follow on the same GitHub Chromium runner:

| NPC | Sim speed | Manual-close mean FPS | Follow mean FPS | Manual-close / Follow zoom |
| --- | --- | --- | --- | --- |
| 20 | 1× | 28.91 | 27.90 | 3× / 3× |
| 20 | 20× | 21.10 | 21.06 | 3× / 3× |
| 100 | 1× | 25.80 | 24.96 | 3× / 3× |
| 100 | 20× | 16.70 | 17.16 | 3× / 3× |

Matched zoom suggests much of the original Fit-vs-Follow FPS drop was due to differing zoom scales, **not exclusively camera motion**. Frame-time p95 and JS heap are recorded per mode in the artifact. Small-sample timing variation and headless environment prevent a physical-device FPS claim. The AFK test in this run was flaky on its first attempt after hidden/resume; `fastForward` deadline skipping has been replaced with clock `runFor` crossing the deadline. Its final-result status must be checked.

## Flaky E2E diagnosis and isolation (run 38840611102)

GitHub CI [38840611102](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38840611102) **FAILED** on the mock-clock AFK idle assertion (even after `clock.runFor`) and one intermittent legacy governance timeline smoke assertion. GitHub Playwright trace was downloaded and examined: fake-clock `runFor(1300)` sometimes returned in a few milliseconds without delivering the expected AFK transition, whereas a passing attempt processed frames for much longer. This implicates the simulated clock/test scheduling rather than proving a production AFK defect, but the old test could not be trusted.

The AFK E2E now intercepts only `setTimeout(..., 45000)` in the test page, executing that specific timer after 800ms while leaving `performance.now`, animation frames and other browser timers real. It still requires true AFK entry, different existing scene anchors after the actual 9-second cooldown, manual activity override, hidden-tab guard, and reduced-motion disable. The 45,000ms API contract is therefore part of the interception condition rather than silently being rewritten in production. Final CI recheck required.

The governance test failure happened in untouched legacy code and is not attributed to camera changes without independent reproduction. Keep it as an open regression observation if repeated.
