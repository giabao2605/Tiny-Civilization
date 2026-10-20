# E04-F — Integration QA and coverage

**Recorded:** 2026-10-20. Evidence fields distinguish implemented assertions from executed tests. Unrun tests are **NOT RUN**, not PASS.

| Concern | Implemented coverage | Status of E04-F evidence |
|---|---|---|
| Day/night, clear/cloudy/rain/fog | Canonical tick, four initial weather seeds, 72-hour replay; 06/12/18/23 screenshots planned | NOT RUN (E04-F CI/E2E) |
| 48×48 migrated v5, 96×96 native v6 | Six map×population fixtures, v5 import and v6 round-trip | NOT RUN |
| Population 20/50/100 | 24 Node cases, browser profile matrix | NOT RUN |
| Camera fit/follow/zoom, restart, reduced motion | Playwright lifecycle/camera screenshots, one-canvas and paused state assertion | NOT RUN |
| PC viewports 1366×768, 1920×1080, 2560×1080 | 24 screenshots with particles disabled; 96×96/100 browser profile in three sizes | NOT RUN |
| Legacy 1×/5×/20×, optional 5/10/15-min day | Accumulator assertions and real UI selection test | NOT RUN |
| Consecutive routes/no teleport, nonnegative resources | Hourly trace checks and source/sink-adjusted resource audit | NOT RUN |
| Money, economy, social, governance, building | 72-hour deterministic comparisons and inherited golden/soak suites | NOT RUN (E04-F); inherited predecessor Fast CI PASS |
| Save/replay/v5/v6/malformed imports | E04-F matrix; existing `v6.test.ts`, `save.test.ts`, weather and coordinator suites | NOT RUN (E04-F) |
| Audio unlock/mute/volume, pause/hidden, lifecycle | Existing pure audio tests and new browser UI check | PARTIAL design coverage; manual listening NOT RUN |
| Rain shelter and shelter release over real transitions | Existing E04-E behavior tests; E04-F 72-hour matrix | PARTIAL, no full live visual evidence |
| 60–120 min real-time soak and leak assessment | Opt-in browser spec, five-minute snapshots and screenshots | NOT RUN |

**Not an exhaustive 108-case Cartesian product.** 48/96 × 20/50/100 × 3 viewports × 6 clock modes is 108 primary permutations before weather variations. Current plan deliberately covers clock contract independently, weather–population–size interactions in Node, 24 visual screenshots for 20 NPC, and eight browser profiling samples. Uncovered browser combinations remain PARTIAL.

## Risk and interpretation

- A test that compares 72h results verifies replay correctness but does **not** establish real-time 60-minute stability.
- A shortest-route check at the final snapshot alone misses intermediate teleports; the new per-hour loop explicitly checks the beginning and ending tile against the previous authoritative state.
- A conservation audit must account for actual food harvested/consumed, wood produced/construction material and trading transfers. Only money has a simple absolute invariant.
- A fixed seed can change weather after its starting state; screenshot checks therefore pause within the initial guaranteed 24-hour dwell.
- `Observer Pace` has long real-world gaps between hourly ticks. The existing UI admits that NPC movement is not continuous during these gaps. Watchability/default-pace gate remains **PARTIAL**.

## Evidence required for final acceptance

Link the PR HEAD SHA to successful Fast CI; run manual Chromium Full E2E and inspect screenshots; run 60+ min local-PC soak and inspect heap/texture/scene trends; listen to audio before/after user gesture, pause and hide; add PC hardware/browser versions and measured values. Do not mark the overall E04-F phase VERIFIED before these gates have evidence.
