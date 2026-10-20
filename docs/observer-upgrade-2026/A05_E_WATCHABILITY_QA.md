# A05-E — Watchability QA

Legend: PASS / FAIL / PARTIAL / NOT RUN / NOT MEASURED.

| Gate | Evidence / result | Status |
| --- | --- | --- |
| 30-second cosmetic scheduling in named fixture | `director.test.ts` virtual clock + `visualModel.test.ts` in-memory handle registry; confirms actual registry creation under a supplied visibility predicate, **not Phaser rasterization** | PARTIAL pending exact-HEAD CI |
| 5-minute three **different visual categories** | Fixture hour 07:00 enables actual market/wildlife/domestic anchors; `visualModel.test.ts` asserts >=3 categories **on in-memory handles** rather than scheduler counters | PARTIAL pending exact-HEAD CI and real browser |
| Camera-visible event preference | `director.test.ts`: nearby home vs distant nature with bounded offscreen fairness | PARTIAL pending exact-HEAD CI |
| Real 30-second screen sign-of-life | Optional Playwright file captures `a05e-30s.png`; human review still required | NOT RUN |
| Real five-minute, >=3 distinguishable on-screen categories | Optional Playwright test logs categories from Phaser **created handles**, saves `a05e-5min.png`; human inspection/video still required | NOT RUN |
| Twenty to thirty minutes, multi-district variety/repetition | Requires live continuous observation with event/category timeline | NOT RUN |
| 1366x768, 1920x1080, 2560x1080; fit/pan/zoom/follow/AFK | Existing E04-F/N03-F browser suites; new physical review still missing | NOT RUN in this task |
| Clear/cloudy/rain/fog, dawn/day/dusk/night, v5/v6, 20/50/100 | Pure ambient unit coverage exists; manual full matrix unexecuted | PARTIAL |
| Soundscape, stereo and comfort on speakers/headphones | A05-D built Web Audio; no device audition | NOT RUN |

## Evidence interpretation
1. **Candidate**: catalog returns an eligible option. Not yet scheduled.
2. **Started**: director emits a transition. Not yet rendered.
3. **Handle created**: Phaser graphics/container successfully constructed. The new `renderedCategories` metric is measured here (bounded category/type sets); repeat camera re-entry does not inflate distinct counts.
4. **Camera intersection**: visibility predicate accepts position in `camera.worldView`. A clipped/covered/tiny silhouette may still be hard to discern.
5. **Human perceivable**: requires screenshot/video or in-person viewing. **No PASS claimed** without this evidence.

## Reproduction on desktop
```bash
npm ci
npm run dev
# Use browser http://localhost:5173/?observerPerf=1
# Optional 5 real minutes of Chromium capture:
npx playwright test tests/e2e/a05e-watchability.spec.ts --project=chromium
```
Default Playwright config defines a Desktop Chrome project implicitly; if the CLI rejects `--project=chromium`, omit that flag and run `npx playwright test tests/e2e/a05e-watchability.spec.ts`.

Inspect screenshots and verify three **different categories can actually be identified by an observer**. Use an unpaused game and fit camera. The test imports a **test-only v6 fixture** using the real JSON importer, then selects Observer Pace 15 minutes/day; this does not affect production defaults. The test may fail on slow machines, and its `renderedCategoryCount` alone cannot validate perceived visibility.