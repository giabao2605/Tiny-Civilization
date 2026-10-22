# Q07-F final acceptance QA-01..QA-12

Baseline: `main@71aedc08fce9b3e78cf2d4f5df296c16fb955809` (PR #52 merged); [post-merge Fast CI](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39714112744) completed/success on exact merge SHA. Q07-F branch: `feat/q07-f-release-review`. Review date: 2026-10-22. Q07-F final-head CI must be verified separately; this baseline CI does not verify Q07-F changes.

| ID | Acceptance | Source / reused tests | Final status | Missing manual/hardware evidence | Risk |
|---|---|---|---|---|---|
| QA-01 | Visual identity | `src/game/render/artKit.ts; terrain.ts; visualHash.test.ts` | **NOT RUN** | Desktop screenshots and side-by-side silhouettes, overview readability | P2 |
| QA-02 | Camera | `src/game/camera/q07c.cameraQA.test.ts; cameraMath.test.ts; afkDirector.test.ts` | **PARTIAL** | PC pan/zoom/follow/resize click evidence | P1 gate |
| QA-03 | World 96×96; 3 districts; ≥20 POIs | `src/sim/world96.test.ts; world96Layout.test.ts; world96Layout.ts` | **PARTIAL** | Rendered POI/roads and district inspection | P1 gate |
| QA-04 | Weighted routing and finite fallback | `src/sim/weightedPathfinding.test.ts; routing.test.ts; n03e.recovery.test.ts` | **PARTIAL** | Long natural-route trace on PC | P1 gate |
| QA-05 | NPC life, needs, economy, social, governance | `src/sim/economy.test.ts; social.test.ts; governance.test.ts; q07b.replay.test.ts` | **PARTIAL** | Visible daily routine / causal observation across populations | P1 gate |
| QA-06 | 06/12/18/23 lighting with HUD off | `src/game/render/lighting.test.ts; src/sim/clock.test.ts` | **PARTIAL** | Four phase HUD-off screenshots | P2 |
| QA-07 | Clear/cloudy/rain/fog visual/audio/NPC | `src/sim/weather.test.ts; weatherShelter.test.ts; src/game/render/weatherVisuals.test.ts` | **PARTIAL** | Real rendered weather and audio observations | P1 gate |
| QA-08 | 30s signs, ≥3 categories/5min, 20–30min progression | `src/game/ambient/q07d.watchability.test.ts; Q07_D_WATCHABILITY_MATRIX.md` | **PARTIAL** | Timestamped 30s/5min/20–30min rendered recording | P1 gate |
| QA-09 | Atomic save formats 1/2/3, replay | `src/persistence/q07e.atomic.test.ts; t06c.integrity.test.ts; t06c.golden.test.ts` | **PARTIAL** | Browser localStorage denied/quota and live export recovery | P0 gate |
| QA-10 | 60 FPS target and p95 timing, 20/50/100 | `src/sim/benchmark.test.ts; Q07_E_PERFORMANCE_MATRIX.md` | **NOT MEASURED** | Named PC FPS median/p95 and frame timing; 200 stress unsupported | P1 gate |
| QA-11 | 60–120 minute soak and resource stability | `src/app/localRuntime.test.ts; Q07_E_SOAK_AND_LIFECYCLE.md` | **NOT RUN** | Actual soak logs with 0/15/60/120 resource samples | P1 gate |
| QA-12 | Local PC UX / offline / save/mute/reduced motion | `src/app/localRuntime.test.ts; README.md; src/game/audio/soundModel.test.ts` | **PARTIAL** | Structured production-preview smoke, offline, settings, storage; owner qualitative PC smoke PASS | P1 gate |

**Count:** PASS 0; PARTIAL 9; FAIL 0; NOT RUN 2; NOT MEASURED 1. Statuses describe full product acceptance, **not assertion that tests failed**. Automated source is present and main exact-sha Fast CI passed; individual cases on Q07-F final SHA require a new run. Fixtures: native seed 101/107/127/12345, populations 20/50/100, 96×96; legacy v5 48×48; desktop viewports 1366×768, 1920×1080, 3440×1440. These are planned fixture/viewport values, not records of manual execution.

**Evidence hierarchy:** CI verifies invoked automated suites; source review checks implementation; user-reported PC smoke is qualitative; no FPS/soak/rendered event proof is synthesized. A P1 *gate risk* is not a confirmed P1 bug.
