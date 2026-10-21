## Observer Plan 06 — T06-E PC local/offline packaging (2026-10-21)
- Verified T06-D PR #44 MERGED at main@`a005f5dba6ab6e36b362a2328505db59250b139c`; post-merge [Fast CI #39536526844](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39536526844) completed/success on exact main SHA. Implementation on `feat/t06-e-local-offline`, **Draft PR pending** until created; no merge/deploy.
- Audited Vite local root base, localhost scripts, bundled assets, optional external GitHub Issues link and localStorage/JSON import/export. Current save format 1/2/3, 8 MiB, atomic import and T06-C frozen fixtures remain unchanged. Added lightweight static local/offline entrypoint regression checks, expanded README with PC local start/build/preview, backup and troubleshooting.
- **Direct npm and local PC browser smoke: NOT RUN** (sandbox terminal DNS blocked clone). No real browser FPS/audio/heap/soak claimed. Final Fast CI audit/typecheck/lint/Vitest/build status to be checked on exact PR HEAD; do not mark CODE VERIFIED before successful CI.
- See [T06-E implementation](observer-upgrade-2026/T06_E_IMPLEMENTATION.md), [runtime audit](observer-upgrade-2026/T06_E_LOCAL_RUNTIME_AUDIT.md), [offline audit](observer-upgrade-2026/T06_E_OFFLINE_DEPENDENCY_AUDIT.md), [save QA](observer-upgrade-2026/T06_E_SAVE_INTEGRITY_QA.md), [manual smoke](observer-upgrade-2026/T06_E_LOCAL_SMOKE_QA.md), [T06-F handoff](observer-upgrade-2026/T06_E_HANDOFF.md).

## Observer Plan 06 — T06-D Renderer / Map optimization (2026-10-21)
- T06-C PR #43 MERGED at `main@00e8706998d3c55d195ad06242ad1eb3c01d7b46`; post-merge CI #39399807790 SUCCESS. [Draft PR #44](https://github.com/giabao2605/Tiny-Civilization/pull/44), `feat/t06-d-render-map-performance`; no merge/deploy.
- Renderer: camera viewport culls decorative forest tree images with 30px overscan, reuses handles on return and releases refs on shutdown. Static terrain raster cache already existed; no gameplay/RNG/simulation/save edits. Added pure forest-culling Vitest tests.
- Fast CI #39531644349 SUCCESS at earlier `7b16e8b3`: 51/51 Vitest files, 444/444 tests, production audit/typecheck/lint/build. New final HEAD requires own CI.
- Owner requested only PC local play and **removed Chromium benchmarking requirement**. Deleted task-specific T06-D browser profile workflow and Playwright tests. Optional earlier paired run #39531644418 SUCCESS, but did **not demonstrate FPS improvement** (headless CI median 4.26 FPS both); it is not local PC certification.
- Local PC FPS/audio/soak NOT MEASURED. Fast CI and pure geometry checks remain verification gates. No requirement to deploy or test Android. See `docs/observer-upgrade-2026/T06_D_*.md` and T06-E handoff.

## Observer Plan 06 — T06-C Save Compatibility & Integrity (2026-10-20)
- Verified [T06-B PR #42](https://github.com/giabao2605/Tiny-Civilization/pull/42) merged in `main@d91a1b0b772ac25ba86edb159c017fde3b2ad51b`; its exact post-merge [Fast CI #39394639636](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39394639636) is **SUCCESS**, 49/49 files and 421/421 Vitest tests.
- **Draft [PR #43](https://github.com/giabao2605/Tiny-Civilization/pull/43)** on `feat/t06-c-save-compatibility` (not merged). Existing format 1/2/3 readers, migration, weather and 8 MiB writer remain unchanged. Fixed missing `leaderId` cross-reference validation in queued governance commands (reader and writer); no on-disk format, economy, weather RNG, clock or renderer changes.
- Added T06-C invalid import/UTF-8/synthetic v6-format-2/240-hour v5→v6 replay tests and **12 frozen engine-derived SHA-256 checkpoints** (48/96 × 20/50/100 × seeds 101/12345) from [CI #39397276992](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39397276992). The initial CI had 443 PASS / 1 FAIL due to changed invalid-tick error precedence; fixed in subsequent commit and awaiting new CI. Added Chromium forged pending-command import test and corrected stale W02-E E2E format expectations from v2 to v3. Kept genuine frozen v5 golden SHA unmodified; generated checkpoints must not be mislabeled historical golden captures.
- **PR exact-final-head Fast CI: PENDING** until GitHub Actions completes on final commit. Local npm shell: **NOT RUN** (checkout/DNS unavailable); Chromium E2E and PC localStorage quota: **NOT RUN**; Windows FPS, heap and soak: **NOT MEASURED**. Do not merge or claim T06-C CODE VERIFIED before final SHA CI review.
- [Implementation](observer-upgrade-2026/T06_C_IMPLEMENTATION.md) · [Compatibility](observer-upgrade-2026/T06_C_SAVE_COMPATIBILITY.md) · [Fixtures](observer-upgrade-2026/T06_C_GOLDEN_FIXTURES_QA.md) · [Validation](observer-upgrade-2026/T06_C_VALIDATION_QA.md) · [Determinism](observer-upgrade-2026/T06_C_DETERMINISM_QA.md) · [T06-D Handoff](observer-upgrade-2026/T06_C_HANDOFF.md).

## Observer Plan 06 — T06-B Instrumentation & Boundaries (2026-10-20)
- Based on verified `main@6b44a6f0e81e99438b1a8238153b406cfdf108d3`, T06-A PR #41 merged and post-merge [Fast CI #39390044744](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39390044744) SUCCESS, 48/48 files and 400/400 Vitest tests.
- Proposed [Draft PR #42](https://github.com/giabao2605/Tiny-Civilization/pull/42) on `feat/t06-b-instrumentation`, **NOT MERGED**. Bounded DEV-only tick/route/UI publish and Phaser frame p50/p95/max measurements, camera/lifecycle/particle/ambient/audio source counters, toggleable collapsed debug readout. R01 coordinator multi-caller shared scheduler lease ownership fixed with idempotent disposers and regression tests.
- New 48/96 × 20/50/100 × seed 101/12345 diagnostic OFF/ON equality, speed/observer pace parity and pause/hidden tab tests are added. Code-validation [Fast CI #39392870084](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39392870084) at `0aa4db31` **SUCCESS**, 49/49 files and 421/421 tests; exact final documentation HEAD CI still needs verification. No claimed browser or Windows hardware performance from Node tests. No gameplay RNG, simulation tick, save/parser/schema, worker, backend or Pages changes.
- Browser E2E: **NOT RUN** here; real Windows FPS/CPU/heap/audio and long soak: **NOT MEASURED / NOT RUN**. New Node 72-tick baseline is MEASURED at implementation SHA `0aa4db31` (see T06_B_PERFORMANCE.md; 96×96/100 seed 12345 tick p95 16.879 ms, max 52.189 ms). Performance optimizations deferred to T06-D.
- [Implementation](observer-upgrade-2026/T06_B_IMPLEMENTATION.md) · [Instrumentation](observer-upgrade-2026/T06_B_INSTRUMENTATION.md) · [Determinism](observer-upgrade-2026/T06_B_DETERMINISM_QA.md) · [Lifecycle](observer-upgrade-2026/T06_B_LIFECYCLE_QA.md) · [Performance](observer-upgrade-2026/T06_B_PERFORMANCE.md) · [T06-C Handoff](observer-upgrade-2026/T06_B_HANDOFF.md).

## Observer Plan 06 — T06-A Preflight Audit & Baseline CI (2026-10-20)
- Branch `feat/t06-a-preflight-baseline`, [DRAFT PR #41](https://github.com/giabao2605/Tiny-Civilization/pull/41) against main, **NOT MERGED**. Verified main `4561660af5c55179df90b73e0d41e5f14b75eede`, A05-E PR #39 MERGED, T06-F PR #40 CLOSED and NOT MERGED.
- [Main Fast CI #39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907) **SUCCESS on exact verified base SHA**: `npm ci`, production audit, typecheck, lint, Vitest **47/47 files, 394/394 tests**, build. GitHub hosted Ubuntu 24.04 / Node v22.23.3. Browser Playwright **NOT RUN** in Fast CI. T06-A candidate final SHA and its corresponding CI must be checked on PR before claiming completion.
- Captured **MEASURED** `E04F_NODE_MATRIX` across 48/96, 20/50/100 and four seed/weather fixtures; 96×96/100 NPC seed 3 Node tick p95 **33.535 ms**. T06-A adds read-only `T06A_NODE_BASELINE` for p50/p95/**max**, path calls, save bytes and parse time, to be measured in final candidate CI.
- Source-level risk: repeated coordinator `start()` returns a no-op second disposer; fix and regression belong to T06-B. Existing legacy v5 and v6/weather migration save tests pass on main, but physical PC screenshot/FPS/audio/CPU/heap/soak **NOT RUN / NOT MEASURED**. No gameplay/clock/RNG/schema/engine change, no Pages deployment.
- Documents: [Implementation](observer-upgrade-2026/T06_A_IMPLEMENTATION.md) · [Architecture](observer-upgrade-2026/T06_A_ARCHITECTURE_AUDIT.md) · [Baseline QA](observer-upgrade-2026/T06_A_BASELINE_QA.md) · [Performance](observer-upgrade-2026/T06_A_PERFORMANCE_BASELINE.md) · [Risks](observer-upgrade-2026/T06_A_RISKS_AND_BLOCKERS.md) · [T06-B Handoff](observer-upgrade-2026/T06_A_HANDOFF.md).

## Observer Plan 05 — A05-E Watchability Tuning & Performance (2026-10-20)
- Preflight verified A05-D PR #38 merged into `main@c5786143`; exact post-merge [Fast CI #39381545911](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39381545911) SUCCESS. No newer merged PR at branch creation.
- Draft [PR #39](https://github.com/giabao2605/Tiny-Civilization/pull/39), branch `feat/a05-e-watchability`, unmerged. Camera-visible ambient fairness tuning, authentic hour-07 three-category visual fixture assertion, overview silhouette scaling, allocation reduction and bounded viewport-rendered category/type instrumentation. Optional five-minute browser evidence test added; no simulation/RNG/save changes, no Pages deploy.
- **Implementation submitted for CI; not fully VERIFIED.** Fast CI on exact final docs HEAD needs confirmation. Unit fixture is not human screenshot proof; headless real-browser 30s/5min, PC audio listening, FPS/heap before-after and 60/120min soak: **NOT RUN / NOT MEASURED**.
- [Implementation](observer-upgrade-2026/A05_E_IMPLEMENTATION.md) · [Watchability QA](observer-upgrade-2026/A05_E_WATCHABILITY_QA.md) · [Performance QA](observer-upgrade-2026/A05_E_PERFORMANCE_QA.md) · [Regression QA](observer-upgrade-2026/A05_E_REGRESSION_QA.md) · [Handoff](observer-upgrade-2026/A05_E_HANDOFF.md).

## Observer Plan 05 — A05-D Ambient Audio & Localized SFX (2026-10-20)
- Verified A05-C PR #37 merged: main@24573918; Fast CI #39366800211 SUCCESS.
- Working branch `feat/a05-d-ambient-audio`: React-owned shared Web Audio mixer, canonical day/night/weather gain, transition-only bird/cart/bell/market/drip cues, world-space stereo attenuation, mute/volume buses, bounded polyphony and lifecycle cleanup. No simulation/save/RNG changes; no Pages deployment.
- Unit and integration tests added for spatial gain, duplicate/ended/cancelled voices, gesture unlock, denial, and director transitions. **Fast CI on implementation SHA dfd52cc3: SUCCESS** ([run #39369238733](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39369238733)); 47 files / 392 tests PASS, npm ci, audit, typecheck, lint and build PASS. Exact final documentation HEAD CI: pending recheck. Real PC auditory acceptance: **NOT RUN**; FPS/heap and soak: **NOT MEASURED**.
- Documentation: [Implementation](observer-upgrade-2026/A05_D_IMPLEMENTATION.md) · [Architecture](observer-upgrade-2026/A05_D_AUDIO_ARCHITECTURE.md) · [Audio QA](observer-upgrade-2026/A05_D_AUDIO_QA.md) · [Lifecycle QA](observer-upgrade-2026/A05_D_LIFECYCLE_QA.md) · [A05-E Handoff](observer-upgrade-2026/A05_D_HANDOFF.md). PR unmerged.


## Observer Plan 05 — A05-C Visual Vignettes (2026-10-20)
- Baseline A05-B PR #36 merged into `main@a5e4d74a`, post-merge [CI #39364001448](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39364001448) SUCCESS.
- Implementation on `feat/a05-c-visual-vignettes`: bounded source-drawn cart/bird/pet/market/real-NPC-gesture/smoke/rain-shelter visuals, camera culling and scene-lifecycle handle registry; never new gameplay citizens, simulation RNG, market stock, social changes or audio.
- Read-only `getAmbientDiagnostics()` now exposes **actual** live `renderedActors`, `createdVisuals`, `destroyedVisuals`, not A05-B's unrendered descriptor forecast. New pure model/lifecycle tests.
- [Implementation](observer-upgrade-2026/A05_C_IMPLEMENTATION.md) · [Architecture](observer-upgrade-2026/A05_C_VISUAL_ARCHITECTURE.md) · [Visual QA](observer-upgrade-2026/A05_C_VISUAL_QA.md) · [Lifecycle QA](observer-upgrade-2026/A05_C_LIFECYCLE_QA.md) · [A05-D handoff](observer-upgrade-2026/A05_C_HANDOFF.md).
- Final branch CI: PENDING VERIFICATION. Browser screenshots, real-PC 30s/5min watchability and FPS/heap/soak: **NOT RUN / NOT MEASURED**. No merge or Pages deployment.


## Observer Plan 05 — A05-B Deterministic Ambient Scheduler (2026-10-20)
- Implementation branch `feat/a05-b-ambient-scheduler` from A05-A merged `main@b52d832f`, post-merge Fast CI #39360324394 SUCCESS.
- One presentation-owned ambient director; scene-integrated bounded virtual clock, candidate fairness, per-tick deduplication, end/cancel/release and road-only cart preflight.
- Unit/virtual-time and replay tests: see [A05-B Lifecycle QA](observer-upgrade-2026/A05_B_LIFECYCLE_QA.md) and [Determinism QA](observer-upgrade-2026/A05_B_DETERMINISM_QA.md). Final PR SHA Fast CI verification required before PASS.
- A05-C actual visuals, A05-D audio, A05-E watchability/FPS/soak remain NOT RUN / NOT MEASURED. No Pages deployment, no merge.

## Observer Plan 05 — A05-A Event Taxonomy & Instrumentation (2026-10-20)

- **CODE VERIFIED / PR #35 awaiting review (do not merge)** on `feat/a05-a-event-taxonomy`, based on E04-F merge `bd43ed2d`; prior post-merge [CI #39355971369](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39355971369) PASS.
- A05-A implements cosmetic-only catalog, real anchor indexing, budget/cooldown and read-only instrumentation, deterministic 48×48/96×96 fixtures. No gameplay/save/clock changes. Code Fast CI [#39358669392](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39358669392) PASS on `16ee6590` (43 files/364 tests); final docs-only HEAD CI must be checked.
- [Implementation](observer-upgrade-2026/A05_A_IMPLEMENTATION.md) · [Catalog](observer-upgrade-2026/A05_A_EVENT_CATALOG.md) · [Architecture](observer-upgrade-2026/A05_A_ARCHITECTURE.md) · [QA](observer-upgrade-2026/A05_A_QA.md) · [A05-B Handoff](observer-upgrade-2026/A05_A_HANDOFF.md).
- 30-second, 5-minute, PC FPS/memory/soak targets **NOT MEASURED** (no scheduler/sprites/audio in A05-A).

## Observer Plan 04 — E04-D Weather Visual Map Response (2026-10-19)

- Preflight: E04-C PR #31 merged into main at 972bf33b41cfa855fb79f1fd13bffd56d624d996, post-merge Fast CI #39220531182 success on exact SHA.
- Branch feat/e04-d-weather-visuals: render-only clear/cloudy/rain/fog, cloud shadows, stratified fog, world-space wet roads/puddles/ripples and bounded 112-descriptor camera-visible rain. No simulation, economic/weather RNG, clock, save or NPC changes.
- Automated regression and new visual tests require final PR-head Fast CI verification before PASS can be claimed.
- **Mandatory visual QA: PARTIAL / NOT VERIFIED.** Live screenshots and real-PC FPS/GPU/heap were unavailable in this environment. **Do not auto-merge** without visual acceptance even if CI passes; no Full E2E or Pages workflow dispatch.
- Docs: [Visual ADR](observer-upgrade-2026/E04_D_VISUAL_ADR.md) · [Implementation](observer-upgrade-2026/E04_D_IMPLEMENTATION.md) · [Visual QA](observer-upgrade-2026/E04_D_VISUAL_QA.md) · [Handoff](observer-upgrade-2026/E04_D_HANDOFF.md).

## Observer Plan 04 — E04-C Deterministic Weather State & Save Compatibility (2026-10-19)

- **Preflight verified:** PR #30 E04-B merged to `main@6483ae97f2e409184548285c18ba077be3a9d9b1`; [post-merge Fast CI #39216281181](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39216281181) SUCCESS with matching `head_sha`.
- **Branch:** `feat/e04-c-weather-state`. Authoritative clear/cloudy/rain/fog with independent seeded weather RNG, bounded 24–72 game-hour dwell and canonical tick transitions. E04-C ONLY: no graphics, NPC effects, clock or economic RNG changes.
- **Save decision:** freeze legacy v5 48×48 bytes/replay; v6 48/96 runtime holds weather. New format 3 `sim-v6-weather` requires strictly validated weather; historical format 1 and format 2 are read and hydrated at the saved tick, without past-tick replay or lost commands. Canonical v5 projection strips weather for old golden SHA stability.
- Unit, paired deterministic 48×48 continuation, 96×96 save-split/replay (20/50/100 NPC), malformed state/import and boundary tests added. Frozen fixtures unchanged; inherited Fast CI must be checked on **final PR SHA** before calling PASS. Local npm and optional E2E unavailable here, hardware performance/FPS **NOT MEASURED**.
- [Weather ADR](observer-upgrade-2026/E04_C_WEATHER_ADR.md) · [Implementation](observer-upgrade-2026/E04_C_IMPLEMENTATION.md) · [Migration QA](observer-upgrade-2026/E04_C_MIGRATION_QA.md) · [Handoff to E04-D](observer-upgrade-2026/E04_C_HANDOFF.md). Do not merge without owner request.

## Observer Plan 04 — E04-B Day/Night Lighting & Windows/Street Lights (2026-10-19)

- **Preflight PASS:** PR #29 E04-A merged to `main@90fe91292d4a20f6f747928f5ab81ec9422cccfb`; [post-merge Fast CI #39213160232](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39213160232) SUCCESS on that exact SHA.
- **Branch:** `feat/e04-b-day-night-lighting`; E04-B *only*. Four-phase keyframed hour curve and a single bounded, render-only interpolation controller. Lighting targets derive from `hourOf(snapshot.world.tick)` with no independent clock. Pause and hidden-tab snap to current canonical target; reduced-motion avoids animated transitions.
- Window apertures follow source-drawn ArtKit building geometries; street lights are sparse, seed-stable, placed on actual 48/96 road geometry near civic hubs. Two reusable world-space light textures and a single tint overlay render above terrain/NPC, without per-frame shape reconstruction, gameplay collision or click interception. No changes to engine/clock/coordinator/save/RNG.
- Tests: 24 hours, boundaries, 23→00, finiteness/contrast, no independent tick, bounded easing, 48×48/v5 and 96×96/v6 layout validity, stable geometry and identical WorldState/digest. Inherited deterministic goldens and benchmarks remain enabled. **Final-head Fast CI must be confirmed via PR checks and matching commit SHA; no local npm run is claimed.**
- [Implementation/verification](observer-upgrade-2026/E04_B_IMPLEMENTATION.md) · [E04-C handoff](observer-upgrade-2026/E04_B_HANDOFF.md). Optional Chromium/manual local-PC screenshots/FPS and multi-viewport assessment **NOT VERIFIED**; visual acceptance **PARTIAL**. Do not infer smooth 20× or 60 FPS from pure tests. No optional E2E, Pages or auto-merge triggered.

## Observer Plan 04 — E04-A Clock ADR & Observer Pace (2026-10-19)

- **Baseline verified:** PR #28 N03-F merged at `aa9de47cdd7cfab1e87b8c3217e41c64e2ac12dc`; [Fast CI after merge #39209568831](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39209568831) SUCCESS on that exact SHA.
- **E04-A implementation branch:** `feat/e04-a-clock-observer-pace`; opt-in 5/10/15-minutes-per-day experimental runtime pacing. 1 tick = 1 game-hour, 24/day, legacy 1×/5×/20× 2/10/40 ticks/sec unchanged. Off by default; no weather, lighting, sim scheduling, save state or PRNG changes.
- ADR: [E04_A_CLOCK_ADR.md](observer-upgrade-2026/E04_A_CLOCK_ADR.md). Handoff: [E04_A_HANDOFF.md](observer-upgrade-2026/E04_A_HANDOFF.md). Frozen N03-F `renderPaths` preserved; scene presents observer steps with ordinary tween (up to 450 ms), which is **not yet** convincing continuous movement over 12.5–37.5 seconds per tick.
- Added deterministic clock/transition, full-state six-mode equality with an ordered world policy command, save/replay, hidden-tab/pause and true hourly path tests. [Pre-final Fast CI #39211980594](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39211980594) **PASS** on `519f29ee` (36 files, 290 tests, production audit 0, typecheck/lint/build), BEFORE the final docs/command-test change. **Final exact-HEAD CI must be checked in PR #29 before claiming acceptance.** Local npm steps unavailable in this isolated environment (network DNS); Full E2E, hardware FPS, screenshots and physical 30s/5min watchability **NOT RUN**. Visual/product gate PARTIAL; no default pace decision.
- No auto-merge, optional browser workflow or Pages dispatch for this task.

## Observer Plan 03 — N03-F Performance & Watchability (2026-10-19)

- **N03-E baseline verified:** PR #27 merged as `4b815aff5b3859ea8a47f682fbdc2a44552067ab`; [post-merge Fast CI #39198471157](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157) completed **SUCCESS** on that SHA. This is not a N03-F PASS.
- **Branch:** `feat/n03-f-performance-watchability` from exact N03-E merge. Diagnostic/code acceptance on Fast CI is PASS; PR remains unmerged pending explicit owner approval. Overall gameplay watchability/physical FPS quality remains PARTIAL.
- Added 18-seed/size/population 72-hour observer counters and invariants (`N03F_WATCHABILITY`), v6 1,000-hour replay (`N03F_REPLAY`), synthetic 2-cooldown recovery soak (`N03F_BLOCKED_SOAK`); inherited 27-scenario 720h `N03C_SIM_BENCH` remains unchanged. No engine/PRNG/schema rewrite, no speculative optimization.
- Added an **optional, manual-only** Chromium 100 NPC / 20× / tick≥72 Phaser Follow/Inspector diagnostic; `full-e2e.yml` can preserve `observer-n03-f-evidence` only if intentionally triggered. Chromium is **not a required CI check or PR merge gate**. Automatic Fast CI YAML and Pages workflow unchanged.
- **Follow-up watchability fix:** traced a real 20× presentation teleport to `WorldScene.setSnapshot` dropping 3 intermediate engine ticks; now transient `LivingSnapshot.renderPaths` from `movementTrace` retains all actual hourly `lastMove` cells at 5×/20× and Phaser interpolates those cells. Added immediate `Xem hoạt động` camera tour prioritizing real work/market/eating/social activity; regression coverage. **Simulation engine, goldens, ownership and save unchanged.** This does not eliminate the measured long-distance commute, only makes rendering continuous and actual happenings more visible. Optional Chromium/manual visual diagnostics still NOT RUN, **not a merge blocker**.
- **Verified final-code CI:** [#39206062733](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39206062733), exact implementation HEAD `6a7ec114` **PASS**: 281/281 Vitest (35 files), production audit 0 vulnerabilities, typecheck/lint/build; 27×720h and 18×72h benchmark records. Source 96×96/100 NPC opening 72h is travel-heavy (80.8–81.4% moving NPC-hours) with zero ordinary event-POI idle, a watchability gap. Documentation-only policy update requires newest-head CI before it can be reported as pass. Manual Full E2E **NOT RUN (optional)**; Windows GPU/FPS/long soak **NOT RUN (non-blocking for Fast CI; quality still PARTIAL)**. Local runner cannot resolve GitHub/npm. No browser PASS claimed. [Implementation](observer-upgrade-2026/N03_F_IMPLEMENTATION.md) · [Performance](observer-upgrade-2026/N03_F_PERFORMANCE.md) · [Watchability QA](observer-upgrade-2026/N03_F_WATCHABILITY_QA.md) · [Plan 04 handoff](observer-upgrade-2026/N03_F_HANDOFF.md).

## Observer Plan 03 — N03-E Path Recovery / Fast CI (2026-10-19)

- **Branch:** `feat/n03-e-path-recovery-fast-ci`, base `main@7e8c49bb` (N03-D PR #26 merged). PR #27 was subsequently **merged** into `main` as `4b815aff5b3859ea8a47f682fbdc2a44552067ab` and [post-merge CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157).
- Fast CI `checks` now runs npm ci/security audit/typecheck/lint/Vitest/build only. Full Chromium E2E and production smoke live in **manual** `full-e2e.yml`; Pages deploy is **manual-only**. No browser installation in push/PR workflow; see [instructions](observer-upgrade-2026/CI_FAST_AND_MANUAL_E2E.md).
- Fixed real blocked-route gap: select truly reachable home/commons, or wait on current tile with `waitingForRoute`; bounded retry avoids false rest/travel and repeated blocked events. Inspector displays reason/retry. No teleport or N03-C guarded routing changes.
- Added optional deterministic `ShelterRequest` tick input for future Plan 04; **no weather implementation, PRNG/save-schema change**. Existing N03-D event-POI routine remains.
- Added `n03e.recovery.test.ts` and retained all existing 720h paired economy matrix and frozen goldens. **Fast CI [#39196924014](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39196924014) PASS for source commit `80003379`: 270/270 Vitest, audit/typecheck/lint/build; 2m54s job.** All 27 720h benchmark samples match N03-D accepted baseline exactly in deaths, production, trades, route call counters, events and RNG; hosted p95 rose and is flagged for N03-F. **Full E2E manual NOT RUN**, Windows QA NOT RUN. Document-only final commits require their own green CI.
- [Implementation](observer-upgrade-2026/N03_E_IMPLEMENTATION.md) · [Recovery QA](observer-upgrade-2026/N03_E_RECOVERY_QA.md) · [Performance](observer-upgrade-2026/N03_E_PERFORMANCE.md) · [N03-F handoff](observer-upgrade-2026/N03_E_HANDOFF.md).

## Observer Plan 03 — N03-D readable routines / POI (2026-10-19)

- **Branch:** `feat/n03-d-readable-routines`, based on N03-C merge `f6e9a54b`. **PR/CI: PENDING; DO NOT MERGE** until branch final-head checks and post-merge N03-C gate are green.
- **N03-D QA review (2026-10-19):** Event-only intermediate CI [#39188711226](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39188711226) preserved 30/31 test files (259/260 unit cases); corrected 20:00 premature leave in `f7355ff3`. A separate scenic-POI experiment [#39189642231](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39189642231) broke an immutable N03-A golden and caused 100-NPC seed12345 deaths 0→2, food 2511→2464; it has been **fully reverted**. Never merge this rejected experiment. Natural event-only visits remained sparse, and final rollback-head CI/E2E remains PENDING.
- 96×96 event-POI evening micro-visits only: real short routes, deterministic alternate-day cooldown, two-move reachability budget and 18:00–21:00 bounded visits; food/rest/trade/build stay higher priority. Historic 48×48 replay unaffected.
- Existing social contact rules remain authoritative; leisure chat is possible only for two stationary, co-located adults at the same `role: event` POI, using existing affinity/cooldown/interaction budget. No decoration-only economic site or ghost conversation.
- More details: [N03-D implementation](observer-upgrade-2026/N03_D_IMPLEMENTATION.md), [behavior QA](observer-upgrade-2026/N03_D_BEHAVIOR_QA.md), [performance](observer-upgrade-2026/N03_D_PERFORMANCE.md), [handoff](observer-upgrade-2026/N03_D_HANDOFF.md). Physical Windows FPS/soak remains **PARTIAL**.

## N03-C second regression correction: preserve NPC hourly positions (2026-10-19)

- [CI #39184285575](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39184285575) **FAILED strict newly-added gameplay tests**: even minimum-length weighted A* altered intermediate positions under hunger/rest preemption (96×96/50/seed101 deaths BFS 6 vs weighted 15).
- **Updated** `routing.ts`: propose time-first A*, but only accept if every 4-tile hourly waypoint matches the BFS route; otherwise fallback BFS. Same hourly coordinates, same goal timing, unchanged survival/economy/game speed; cosmetic road preference within an hour where safe.
- **New test:** `src/sim/routing.test.ts` covers acceptance of cheaper safe 4-step path, rejection of unsafe checkpoint divergence, unreachable/same tile/BFS. 720-hour matrix still fails if deaths, trades or food production worsen. N03-B original terrain-optimal path API and N03-A goldens untouched.
- **Final corrected HEAD CI:** PENDING (must include typecheck, lint, Vitest 720-tick matrix, build, Chromium E2E and production smoke). Never mark N03-C done or merge while strict gameplay checks fail. Physical Windows GPU/FPS/soak remains PARTIAL.

## N03-C corrective QA gate (2026-10-19)

- Initial full GitHub Actions [#39020811689](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39020811689) **PASS** typecheck/lint/Vitest/Chromium E2E/production smoke, but **failed gameplay acceptance** in measured 720-hour comparisons. Terrain-only optimum on 96×96 / 50 NPC / seed 101: BFS deaths 6, trades 702, food 1131; weighted deaths 20, trades 554, food 834. This regression must not be shipped just because CI was green.
- Corrected production route: `findTimeFirstWeightedPath` lexicographically minimizes cardinal steps then weighted terrain cost; same four tiles per hour, no alteration to needs, economy or WorldState. N03-B `findWeightedPath` still returns the unrestricted terrain-cost optimum for oracle/benchmarks.
- New small-grid lexicographic Dijkstra tests, production real-NPC shortest route test and 720-hour paired gates assert weighted does **not increase deaths or decrease food production/trades** over BFS across 96×96 20/50/100 × seeds 101/107/12345. Existing N03-A 48/96 golden routes explicitly BFS and fixture hashes unchanged.
- Corrective CI on final branch HEAD: **PENDING**; see PR #25. **DO NOT MERGE** until both CI and gameplay gates are confirmed green, plus benchmark impact reviewed. Physical Windows/GPU/60–120m soak remains **PARTIAL**.

## Observer Plan 03 — N03-C Weighted Routing Integration (2026-10-17)

- **Entry gate PASS:** N03-B PR #24 merged into `main@a95dc075f86d00e8a99dbb345d647bf47843c163`; exact post-merge [CI #39018629697](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39018629697) PASS before branching.
- **Branch:** `feat/n03-c-weighted-routing-integration`, **UNMERGED**. Weighted A* activated for NPC movement on v6 96×96; v5 and migrated v6 48×48 retain BFS. Explicit BFS strategy is the rollback and frozen N03-A golden compatibility path. Resource/construction feasibility probes intentionally stay BFS, not actual movement routing.
- **Mechanics:** no goal priority, speed/energy, money/food/wood, social/governance, map generator, renderer or save schema change. Old N03-A golden manifest remains untouched; new weighted test proves actual NPC route choice against BFS cost.
- **QA planned/executed by branch CI:** 20/50/100 NPC × 48/96 × 3 seeds (101,107,12345) × 720 ticks, plus paired BFS/weighted 96 cases; economy conservation, movement, event ordering, deterministic weighted replay, 96 mid-route save/load, original legacy/migration/routeBlocked/Dijkstra/Chromium suites.
- **Current status:** implementation/tests/docs committed, **final branch HEAD CI PENDING**. The 720-tick and performance results cannot be marked PASS before their actual CI logs. Existing N03-B path microbench A* slower than BFS in all six cases; integrated effects are not yet measured.
- **Physical Windows PC GPU/FPS and 60–120m soak:** **PARTIAL / NOT RUN**. No deployment required. Do not merge without owner approval.
- **Docs:** [implementation](observer-upgrade-2026/N03_C_IMPLEMENTATION.md), [routing QA](observer-upgrade-2026/N03_C_ROUTING_REGRESSION.md), [economic QA](observer-upgrade-2026/N03_C_ECONOMIC_QA.md), [performance](observer-upgrade-2026/N03_C_PERFORMANCE.md), [handoff](observer-upgrade-2026/N03_C_HANDOFF.md).

## Observer Plan 03 — N03-B Weighted A* Core (2026-10-17)

- **Entry gate PASS:** N03-A PR #23 merged into main at 573acc81ee8d06d68a6aeb3505f7796577232352; post-merge [CI #39014402740](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39014402740) PASS, including production Chromium smoke.
- **Isolated branch:** feat/n03-b-weighted-astar-core. Weighted A* 4-neighbor with integer ×10 movement costs, authoritative tile walkability, v6 road subtype metadata, stable heap tie-break, diagnostics. Production BFS/engine and save schema unchanged.
- **QA:** separate Node 22 Dijkstra harness 500/500 varied maps matched; in-repo Dijkstra 50 grids ×12 pairs, 48/96 navigation, ties, water, no mutation and BFS diagnostics. Implementation commit `2d939d02` [CI #39015721866](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39015721866) **PASS**: 28 Vitest files / 239 tests, 40 Chromium E2E, 1 production smoke, typecheck/lint/audit/build/Pages build. Docs-only follow-up still requires final-HEAD CI before VERIFIED.
- **Benchmarks:** paired BFS vs A* Node paths 48/96 × 20/50/100 NPC logged as N03B_PATH_BENCH in [CI #39015721866](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39015721866). A* has higher p50 and p95 computation times in all six samples despite lower median weighted route costs. These are noisy Node microbenchmarks, not integrated tick timings. Exact measurements in [performance](observer-upgrade-2026/N03_B_PERFORMANCE.md). No physical Windows FPS; GPU/soak remains PARTIAL.
- **Handoff:** N03-C alone owns engine integration, gameplay/regression study and possible rollback. No self-merge.
- **Docs:** [implementation](observer-upgrade-2026/N03_B_IMPLEMENTATION.md), [QA](observer-upgrade-2026/N03_B_ALGORITHM_QA.md), [performance](observer-upgrade-2026/N03_B_PERFORMANCE.md), [handoff](observer-upgrade-2026/N03_B_HANDOFF.md).

## Observer Plan 03 — N03-A NPC Behavior Audit & Golden Fixtures (2026-10-17)

- **Entry gate confirmed:** W02-F PR [#21](https://github.com/giabao2605/Tiny-Civilization/pull/21) and CI remediation [#22](https://github.com/giabao2605/Tiny-Civilization/pull/22) merged; `main@cf72134349e9ab3ea800393a96c48c3eb21923c8` post-merge [CI #39009292713](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39009292713) PASS. Windows GPU/60–120-minute soak still PARTIAL.
- **Isolated implementation:** [PR #23](https://github.com/giabao2605/Tiny-Civilization/pull/23), branch `feat/n03-a-behavior-audit-golden-fixtures`, **DRAFT / UNMERGED**. No production gameplay, BFS, simulation PRNG, save schema, renderer or deployment changes.
- **Audit:** source-mapped goal hierarchy, authoritative destination/route/lastMove lifecycle, market/survival/social/governance dependencies and synthetic RouteBlocked reproduction. See [N03-A behavior audit](observer-upgrade-2026/N03_A_BEHAVIOR_AUDIT.md).
- **Regression:** first-three-NPC fixed trace projections over 4×48 hourly ticks, v5 historical fixture (seed 613/p50/t720) and 96×96 seed12345/p20,p50,p100; frozen SHA256 trace, five structured checkpoints, event/RNG ordering, stock/money provenance, dead actors, no water/teleport, 24+24 save/load replay. See [goldens](observer-upgrade-2026/N03_A_GOLDEN_FIXTURES.md), [QA](observer-upgrade-2026/N03_A_REGRESSION_QA.md) and [handoff](observer-upgrade-2026/N03_A_HANDOFF.md).
- **Measured baseline:** Node 22/Linux hosted-runner 48-tick p50/p95 plus path calls, isolated path sampling, route length, movement and activity distribution. Metrics are observations, **not** Windows physical hardware FPS certification.
- **QA gate:** N03-A remains **PARTIAL** until immutable golden manifest and all final-HEAD checks PASS on PR #23; verify actual CI link in PR before marking VERIFIED. N03-B A* is intentionally not implemented or started. Do not self-merge.

## Observer Plan 02 — W02-F final-performance QA update (2026-10-17)

- **PR:** [#21](https://github.com/giabao2605/Tiny-Civilization/pull/21), draft/unmerged; entry gate W02-E main CI [#38995262805](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262805) PASS.
- W02-F pre-optimization baseline [#38997723836](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38997723836) PASS, optimized candidate [candidate CI #38999049391](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38999049391) PASS, both real Chromium/Node on Linux hosted runner seed 12345.
- 100 NPC/20×/1920×1080 Fit: 7.10→10.15 mean FPS, frame p95 216.6→166.6ms (noisy 450ms samples); Node tick p95 120.824→11.861ms; GameObjects 512→481, textures 123→24. 34/36 brief scenarios improved; 2 showed slight declines. Exact v5/v6 BFS parity PASS.
- Static overlay texture, batched entrance marks, lazy labels, visual-only terrain accent, allocation-reduced N/E/S/W BFS. No simulation rules, save schema, A*, weather or audio change.
- Final evidence preservation and longer performance sample queued for next CI. Physical Windows soak/GPU FPS **NOT RUN/PARTIAL**. Plan 02 hardware QA PARTIAL; **do not start N03-A** until owner accepts final-HEAD correctness and outstanding risk.
- Evidence: [performance](observer-upgrade-2026/W02_F_PERFORMANCE.md), [visual QA](observer-upgrade-2026/W02_F_VISUAL_QA.md), [implementation](observer-upgrade-2026/W02_F_IMPLEMENTATION.md), [handoff](observer-upgrade-2026/W02_F_HANDOFF.md), [Windows protocol](observer-upgrade-2026/W02_F_WINDOWS_SMOKE.md).

## Observer Plan 02 — W02-F Density, Performance & Final QA (2026-10-17)

- **Entry gate:** W02-E PR #20 merged into main `eb0a4d50`; *actual post-merge* CI [#38995262805](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262805) and Pages [#38995262917](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262917) both successful (checks include production smoke).
- **Branch/PR:** `feat/w02-f-map-density-performance` / [#21](https://github.com/giabao2605/Tiny-Civilization/pull/21), DRAFT. No self-merge.
- **Baseline:** 96×96 main seed12345, Chromium headless at 100 NPC/20×/1920×1080/Fit: 5.63 FPS mean, frame p95 300 ms, 512 GameObjects, 123 textures, one heap snapshot 60.5 MB, from **post-merge** CI. Not a Windows benchmark, never claim 60 FPS.
- **W02-F scope:** static grass detailing across three districts without sites/roads/POI changes; batch 32 entrance markers, lazy NPC Text labels, optimize BFS numeric neighbors preserving original N/E/S/W order and legacy route outputs. No schema/gameplay RNG/clock/Plan 03+ changes.
- **Proof:** new Node 48-tick + path diagnostics, frozen old-vs-new BFS parity, 36 headless Chromium 20/50/100 × 1×/5×/20× × 4 viewports, real Phaser screenshots; all legacy save/E2E tests retained. First baseline run [#38997723836](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38997723836) is from production code **unchanged** with measurement tests only.
- **Status:** W02-F candidate CI and post-optimization benchmark **PENDING**, so **NOT VERIFIED**. Windows local 60–120 minute soak, real GPU/FPS and manual PC playtest **NOT RUN / PARTIAL**. Plan 02 final physical-PC gate remains PARTIAL, do not start N03-A until owner accepts the documented risks and W02-F correctness is verified and merged.
- **Docs:** [implementation](observer-upgrade-2026/W02_F_IMPLEMENTATION.md), [performance](observer-upgrade-2026/W02_F_PERFORMANCE.md), [visual QA](observer-upgrade-2026/W02_F_VISUAL_QA.md), [handoff](observer-upgrade-2026/W02_F_HANDOFF.md).

## Observer Plan 02 — W02-D road hierarchy, entrances and POIs (2026-10-16)

- **Branch / PR:** feat/w02-d-road-entrances-pois / [#19](https://github.com/giabao2605/Tiny-Civilization/pull/19), draft, do not self-merge. Base main W02-C merge 5c6a9d4e.
- **Implementation:** isolated world96 layout metadata with four real road kinds (main, side, footpath, plaza), three named districts, siteId-linked road entrances and 24 seed-stable decorative/event POIs across the zones. Bounded additional road connections, actual graph-only backup route validation and real unchanged findPath obstruction tests. No production 96 activation, migration, gameplay rules or v5 save changes.
- **QA:** 30 seed/population generator cases extended with a second 30-case metadata matrix plus negative corruption tests. Isolated SVG harness, five Chromium PNG views, archived by GitHub Actions (not production 96 gameplay).
- **Actual verification:** GitHub Actions final PR HEAD **PENDING**; frozen full-world v5 SHA-256, tick720→816, economy/social/governance, smoke and E2E must pass before VERIFIED. W02-C post-merge CI 38880855077 and Pages 38880855112 were still in_progress when first inspected; do not infer PASS. Windows FPS/soak NOT RUN.
- **Docs:** [implementation](observer-upgrade-2026/W02_D_IMPLEMENTATION.md), [layout QA](observer-upgrade-2026/W02_D_LAYOUT_QA.md), [connectivity QA](observer-upgrade-2026/W02_D_CONNECTIVITY_QA.md), [legacy regression](observer-upgrade-2026/W02_D_LEGACY_REGRESSION.md), [handoff](observer-upgrade-2026/W02_D_HANDOFF.md).
- **Next:** after W02-D gate and owner merge, W02-E handles strictly versioned v5/v6 migration, active 96 renderer + runtime and real save/load E2E. W02-F owns Windows performance. Do not do W02-E in this PR.

## Observer Plan 02 — W02-C first complete CI verification (2026-10-16)

- PR [#18](https://github.com/giabao2605/Tiny-Civilization/pull/18), branch `feat/w02-c-96-world-generator`, **still unmerged**. **First complete CI [#38875512363](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38875512363) PASS** at `c628d8fe`: 19 test files / **142 unit tests**, **28 Chromium E2E passed, 1 skipped**, dependency audit, typecheck, lint, build and production smoke all successful. Generated 96×96 seed matrix was exactly **30/30 PASS**; 25 homes + 5 works + commons + market = 32 sites, 4/7/13 resource nodes for 20/50/100 residents.
- GitHub runner median generation+validation **29.03/30.35/34.72 ms** (20/50/100 NPC); slowest was 65.96ms for seed101/pop20. Real 96 runtime smoke and Windows hardware FPS **NOT RUN** by scope (W02-E/F). Source legacy v5 save and tick720→816 frozen full-world SHA-256 regression PASS on this first run.
- **Important:** this verification update is a documentation-only commit on top of `c628d8fe`. **Final-HEAD CI remains PENDING** until a new Actions run completes on this docs commit. Do not merge before that gate. Full measurements: [generation QA](observer-upgrade-2026/W02_C_GENERATION_QA.md).

## Observer Plan 02 — W02-C 96×96 Generator & Districts (2026-10-16)

- **Scope/status:** isolated W02-C generator plus validator and tests staged on `feat/w02-c-96-world-generator`, from `main@bd0e3891`; separate PR, **NOT MERGED**. Final-head CI gate **PENDING**, do not mark VERIFIED before all checks pass.
- **Post-merge W02-B gate verified:** PR [#17](https://github.com/giabao2605/Tiny-Civilization/pull/17) merged at `bd0e3891635792d93f149b88384e25ff20b8d7c5`. Main [CI #38872100206](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38872100206) and [Pages #38872100308](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38872100308) both completed **success**.
- **New code:** `src/sim/world96.ts`: deterministic, seeded 9216-tile terrain, three real districts, 25 housing sites (capacity100), one market, commons, five work sites, finite field/forest nodes; all economic/NPC state initialized through unchanged legacy constructor, relocated with preserved ownership, unique IDs and correct household refs. `validateWorld96` asserts bounds, balances, references, walkability, genuine BFS connectivity and layout separation.
- **Unit work:** `src/sim/world96.test.ts` registers 10 fixed seeds (101,103,107,109,113,127,131,137,139,149) × 20/50/100 = **30 cases**, full deterministic world comparison, direct connectivity, water/barrier checks, corrupt-world rejections, baseline economic invariants and legacy constructor unchanged. Timings and path-call count print on the CI runner; actual results **PENDING**.
- **Isolation:** `schemaVersion:6,map:{width:96,height:96}` is a standalone in-memory runtime type only; production UI, coordinator, engine save parser/export remain strict v5/48×48. No active 96 simulation or production browser E2E is possible until W02-E safety/persistence; do not cast the v6 world to v5.
- **Verification:** local `npm ci`, typecheck, lint, tests, build and Playwright **NOT RUN** (local host cannot resolve github.com); GitHub PR CI checks **PENDING** at authoring; frozen v5 SHA-256 and tick720→816 regressions must pass on **final HEAD**. Physical Windows FPS/GPU/heap soak **NOT RUN**.
- **Docs:** [implementation](observer-upgrade-2026/W02_C_IMPLEMENTATION.md), [seed/QA](observer-upgrade-2026/W02_C_GENERATION_QA.md), [v5 regression](observer-upgrade-2026/W02_C_LEGACY_REGRESSION.md), [handoff](observer-upgrade-2026/W02_C_HANDOFF.md).
- **Next:** verify final PR HEAD CI, fix failures; W02-D handles roads/entrances/POIs; W02-E handles v6 migration and active 96 simulation/save; do not auto-merge or implement these follow-ups in W02-C.

## Observer Plan 02 — W02-B Dimension-Aware Core & Legacy Mode (2026-10-16)

- **Implementation staged** on `feat/w02-b-dimension-aware-core` from W02-A merge `main@094b62742c0ac9b18838cd15f243159e7a7be265`. W02-B only; separate PR, **NOT MERGED**.
- **Core:** explicit validated width/height APIs, row-major index/decode, legacy 48-only wrappers, schema-keyed `dimensionsOf`, sized BFS/walkability, sized terrain neighbor/indexing, scene/camera bounds and restart identity, HUD and foundation selection. Production `WorldState` and save remain **v5/48×48**; 96 is **synthetic geometry only**, no generator/schema migration.
- **Tests added:** 48/96 boundaries, invalid numerical inputs, row-major roundtrips, water barrier/detour deterministic BFS, scene-footprint predicate, synthetic 1152px camera tests, v5 UI resize/Fit/Reset/save/load/remount E2E. Frozen v5 fixture and manifest **untouched**.
- **Verification:** local npm suite **NOT RUN** (container GitHub DNS unavailable); final PR HEAD GitHub Actions **PENDING**. W02-B is **NOT VERIFIED** until full CI + fixed source-golden v5 hash and tick720→816 continuation PASS. Legacy SHA-256 values are pinned in [regression](observer-upgrade-2026/W02_B_LEGACY_REGRESSION.md).
- **W02-A status correction:** PR #16 **merged** in `094b62742`; post-merge CI [38867210224](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38867210224) and Pages [38867210352](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38867210352) were still **in progress** at implementation baseline, must not be labeled PASS without checking later. Prior #16 PR HEAD CI did PASS with 98 tests / 26 E2E pass / 1 skipped and 1 flaky retry.
- **Known open:** W02-A post-merge Pages 38867210352 FAILED near-edge Follow test twice (the same regression as the prior retry); W02-B clamps actual camera state before status broadcasting, initial PR HEAD CI [38868350223](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38868350223) passed npm/typecheck/lint/unit/build but E2E FAILED 27/1 skipped/1 Follow; after finding separately awaited zoom/scroll/viewport reads, E2E now samples a single DOM frame without weakening bounds. Final HEAD CI still required. V01-E physical Windows FPS and GPU/heap soak. [Implementation](observer-upgrade-2026/W02_B_IMPLEMENTATION.md) · [QA](observer-upgrade-2026/W02_B_GEOMETRY_QA.md) · [handoff](observer-upgrade-2026/W02_B_HANDOFF.md).

## Observer Plan 02 — W02-A Geometry Audit / Schema ADR (2026-10-16)

- **Scope W02-A only, PR [#16](https://github.com/giabao2605/Tiny-Civilization/pull/16), branch `feat/w02-a-map-schema-audit`; not merged.** Baseline `main@4149442f` after PR #15. Baseline main [CI 38861069823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861069823) and [Pages 38861069825](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861069825) both PASS.
- **Audit and ADR authored:** [W02_A_GEOMETRY_AUDIT](observer-upgrade-2026/W02_A_GEOMETRY_AUDIT.md) inventories source, geometry/pathfinding, render/camera, persistence/IDs, test and benchmark dependencies; [W02_A_SCHEMA_ADR](observer-upgrade-2026/W02_A_SCHEMA_ADR.md) selects a future v6 per-world `map:{width,height}`, explicit dimension-aware functions, strictly retained legacy 48×48. This PR **does not change schema or generate a 96×96 world**.
- **Authentic v5 checkpoint frozen:** `tests/fixtures/legacy-v5-48x48.json.gz.b64` and `legacy-v5-48x48.expected.json` captured from [CI bootstrap 38861809236](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861809236), using actual `createWorld(613,50)`, 720 ticks and real `serializeSave`. Real source snapshot 263,532 bytes, 30 households, 913 directed relationship edges, 1 governance election, 1 pending policy command. Save/world/96-tick continuation SHA-256 pinned. The checked-in [strict test](../src/persistence/legacy-v5.fixture.test.ts) now fails if either fixture is absent and verifies parser/validation, byte identity, 48 boundary, full world-state and replay SHA; no bootstrap PASS shortcut. [QA](observer-upgrade-2026/W02_A_LEGACY_V5_QA.md), [handoff](observer-upgrade-2026/W02_A_HANDOFF.md).
- **CI status:** baseline/main PASS; W02-A bootstrap PASS, but W02-A **final frozen-fixture HEAD CI awaiting completion** at this documentation commit. Gate remains **PENDING / NOT VERIFIED** until GitHub Actions test/typecheck/lint/build/Chromium E2E passes on final HEAD. No performance/hardware certification implied. Local `npm ci`, typecheck, lint, test, build and E2E **NOT RUN** here (sandbox cannot clone GitHub; GitHub Actions runner separately executes these).
- **Next allowed:** W02-B only after strict final HEAD CI and owner acceptance/merge of PR #16. Open V01-E physical Windows FPS, GPU/heap soak and subjective motion gates remain OPEN (owner-approved deferral).

## Observer Plan 01 (V01-A…E) — COMPLETE / OWNER-ACCEPTED (2026-10-16)

- **Project owner decision (2026-10-16):** explicitly approved merging PR #15 and marking **Plan 01 complete** to proceed to Observer Plan 02. Code & automated acceptance are verified; this is an **owner-approved release gate with documented exceptions**, **not** certification of a physical-device performance target.
- **V01-E verification:** [#38858614357](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38858614357) PASS at `915c3899`; prior source CI [#38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446) PASS, 96 Vitest / 27 Chromium E2E passing and 1 skipped. Implementation PR [#15](https://github.com/giabao2605/Tiny-Civilization/pull/15). The complete camera/art upgrade includes V01-A…E.
- **Deferred quality risks, still OPEN:** Windows physical FPS 20/50/100 × 1×/20×, 60–120-minute GPU/heap soak, subjective motion/depth/edge follow review. Headless CI FPS comparison was inconclusive and mostly numerically lower on the final run; **do not claim 60 FPS, a proven performance win or leak-free operation**.
- **Next task:** Plan 02 **W02-A geometry/save dependency audit and legacy v5 fixture/ADR**, on a separate branch/PR. Check actual files on `main`; W02-A is not recorded as completed. W02-A must **not** implement new 96×96 world generation or migrate saves. Preserve dimensions by world, legacy 48×48 and deterministic gameplay.

## Observer V01-E — Visual & Performance Polish (2026-10-16)

- **Historical V01-E scope status:** code/CI PASS; owner approved **Plan 01 completion/merge with explicitly deferred physical-PC gates** (these remain NOT RUN/PARTIAL). PR [#15](https://github.com/giabao2605/Tiny-Civilization/pull/15) Draft, base `8d639c4a`, final code CI [38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446) PASS: 96 unit, 27 E2E pass, 1 skipped, no flaky retries, production smoke PASS.
- **Changes:** local-space selected halo (no per-frame path redraw), construction redraw only on changed progress, AFK POI list on shot rotation, throttled manual pan status, corrected floor depth for resource/construction bars, camera-zoom-driven NPC ID badge visibility; opt-in DEV render counters with cleanup. Texture-cache NPC experiment was measured and reverted. No `src/sim`, WorldState v5, RNG, save, tick or game systems touched.
- **Evidence:** 54-case CI matrix, 3 viewport PNGs, close-up/highlight/Follow/AFK/near-edge screenshots, 6× remount with stable canvas/object/texture counts. Artifact [run 38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446), compared with baseline [38846829650](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38846829650). 100 NPC × 20× 1920×1080 mean FPS Fit `11.93→8.66`, Follow `7.97→8.92` in short noisy headless CI samples; overall 54-sample mean `20.54→17.73`. **Do not claim performance improvement or hardware 60 FPS** based on these non-matched-tick runner measurements.
- **Required docs:** [Implementation](observer-upgrade-2026/V01_E_IMPLEMENTATION.md) · [Performance](observer-upgrade-2026/V01_E_PERFORMANCE.md) · [QA](observer-upgrade-2026/V01_E_QA.md) · [Handoff](observer-upgrade-2026/V01_E_HANDOFF.md). Windows headed matrix script: `scripts/observer-benchmark.ps1`. Open: PC 20/50/100 FPS p50/p95, 60–120 minute memory soak, manual visual/hidden-tab/NPC boundary camera. **Owner gate decision dated 2026-10-16: Plan 01 accepted as complete with these limitations recorded and deferred; Plan 02 W02-A may begin.**

## Observer V01-D — Follow NPC & Cinematic AFK (2026-10-16)

- **Status:** Implementation and Chromium CI PASS, acceptance **PARTIAL** pending physical-PC performance, long-run leak checks and complete visual QA (not a merge approval).
- **PR:** [#14](https://github.com/giabao2605/Tiny-Civilization/pull/14) (Draft), branch `feat/v01-d-follow-afk` from V01-C merge `a0cddcc2`. V01-C post-merge [CI #38834221427 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38834221427).
- **V01-D verified runs:** [#38837917119 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38837917119), [#38839814189 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38839814189). Latest: 96 Vitest tests, 21 Chromium E2E passed, **1 flaky retry** and 1 skipped; production build/smoke PASS. The new timer-isolated E2E still failed under reduced-motion emulation in run 38841646610 (21 E2E passed, 1 AFK failed, 1 skipped); Scene now checks current media preference every 250ms as a fallback if the change event is missed. E2E verifies both entering and leaving reduced-motion; final CI pending. Do not claim completely clean E2E until re-verified.
- **Scope:** Follow moving render-space NPC sprite; AFK is opt-in OFF by default with real-time 45/60/90-second idle timer, deterministic existing-interest targets, manual override, visibility/reduced-motion handling. Canonical `WorldState`, tick, seed/RNG, economy/social/governance and save v5 untouched.
- **Evidence:** [V01_D_QA](observer-upgrade-2026/V01_D_QA.md) records screenshot review and paired CI runner performance; [V01_D_IMPLEMENTATION](observer-upgrade-2026/V01_D_IMPLEMENTATION.md), [V01_D_HANDOFF](observer-upgrade-2026/V01_D_HANDOFF.md). Keep pending acceptance gates open.

# Tiny Civilization — Progress / handoff log

**Updated:** 2026-10-15  
**Current stage (2026-10-15):** Phase 00–05 DONE and merged. Phase 06 [PR #7](https://github.com/giabao2605/Tiny-Civilization/pull/7) merged at `efa9fa23f44f22b63c4531c2c0df96d9a5a0c37c`; [post-merge CI #38673629622 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38673629622), but real-device benchmark and novice-player quality gates remain **PARTIAL**. Phase 07 release work is on `feat/phase-07-release`, unmerged; public deployment not yet verified.
**Authoritative roadmap:** [MASTER_PLAN](MASTER_PLAN.md)  
**Rules/contract:** [SIMULATION_CONTRACT](SIMULATION_CONTRACT.md)

| Phase | Status | Gate |
| --- | --- | --- |
| 00 Foundation | DONE, merged to main | npm ci, typecheck, lint, Vitest, build, Playwright Chromium PASS |
| 01 Living world | DONE, merged to main (PR #2) | 48×48 map, 20 purposeful agents, inspector, controls; CI PASS |
| 02 Survival | DONE, merged (PR #3) | Finite food/wood, needs, production, shortage/death and verified 10-seed balance |
| 03 Economy | DONE, merged to `main` (PR #4) | All 20/50/100 ten-seed 30-day runs and GitHub Actions PASS |
| 04 Social | DONE, merged to `main` (PR #5) | Directed relationships, causal stories, households/birth/death, 30–180 game-day tests, 5 Chromium E2E, last branch CI PASS |
| 05 Governance | DONE, merged to `main` (PR #6) | Finite food aid, elected leader, poor harvest and illness, 74 unit/8 Chromium E2E; post-merge CI PASS |
| 06 Quality | Code merged to main ([PR #7](https://github.com/giabao2605/Tiny-Civilization/pull/7)), quality gate PARTIAL | Save/load and replay verified, 84 unit/11 Chromium E2E; novice playtest and physical device profile still open |
| 07 MVP release | IN PROGRESS, [PR #8](https://github.com/giabao2605/Tiny-Civilization/pull/8) draft | Release-candidate source/CI/CD prepared; production smoke and public Pages URL not yet verified |
| 08 Expansion | DEFERRED | Only after MVP validation and new go/no-go |

## Phase 06 — Quality & Safe Persistence (2026-10-15; code merged, acceptance PARTIAL)

- Historical implementation baseline: `feat/phase-06-quality` branched from Phase 05 merge `4c03cd8596eb75d436b6df8159c1b9ccca7d65e6`, then merged via PR #7 at `efa9fa23`. Post-merge main CI run `38673629622` succeeded.
- Implemented on branch: `src/persistence/save.ts` versioned `sim-v5-phase06` format, 8 MiB import cap, structural/domain validation for entities, positions, ownership, currency, households, relationships, governance, shocks, timers, trade history and events. Coordinator preserves pending policy commands/request IDs; world is swapped only after successful parse/validation, and loading pauses without any synthetic tick or RNG draw.
- UI: localStorage save/load, downloadable JSON and file import, errors for corruption, schema/version mismatch and full/quota-denied storage. Save is synchronous between browser event-loop ticks; storage-write failure never mutates the live world. Observer onboarding, legible HUD summary, NPC route reason, keyboard focus and mobile save controls.
- Replay regression: `src/persistence/save.test.ts` runs 1000 continuous ticks versus 500 + JSON save/load + queued policy + 500 ticks at populations 20/50/100, seeds 210/613, compares the **entire world**, RNG, governance and currency. Forged IDs, negative cash, invalid terrain, truncated JSON, unsupported engine and oversized file are rejected.
- Measured Node 22 / GitHub Ubuntu sample from [Actions #38670368237](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38670368237) (run fails *only* at a time-sensitive browser hidden-tab assertion, not at the Node benchmark): 1000 ticks seed 543 => 20 NPC p50 **0.212** ms, p95 **1.582** ms, save **110,834** bytes; 50 NPC p50 **0.637** ms, p95 **3.243** ms, save **282,573** bytes; 100 NPC p50 **0.889** ms, p95 **5.191** ms, save **443,278** bytes. These samples meet provisional p95 <25 ms in Node only, **not** proof of physical-device FPS.
- First 10 seeds 100 NPC × 720 ticks normal: all 100 alive and 0 stockout days at daily sampling; p95 across seeds 2.626–4.852 ms. Simply emptying the initial market stock recovered rapidly because farming replenished supply, revealing that this was **not an adequately severe crisis**. Added a separately named famine scenario with initial food and active farm stock/regeneration reduced to zero; results listed below after subsequent CI. This is adversarial test setup, not a balance patch or infinite supply shortcut.
- Browser tests include save-refresh-load, JSON roundtrip, broken and incompatible imports, quota failure, 390px viewport and hidden-tab discard; 100 NPC × 20× with inspector/timeline/save and sampled Chromium frame times was added subsequently. Initial hidden-tab assertion had an invalid fixed 100 ms wall-clock assumption and was corrected to check the actual **absence of synchronous catch-up**, without relaxing the underlying hidden-tab zero-tick test.
- Updated measurements from [CI #38670799035](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38670799035) (all TypeScript/lint/Vitest/build passed; browser 10/11, remaining test incorrectly expected a shock-start event to stay inside a bounded 120-item feed after prolonged 20×): 20 NPC p50/p95 **0.403/2.583** ms; 50 NPC **1.038/5.098** ms; 100 NPC **1.429/8.841** ms across 1,000 ticks. Save sizes unchanged: **110,834 / 282,573 / 443,278 bytes**. CI host load affects timing; p95 still under provisional Node-only 25 ms threshold.
- 10 seeds × 30 days × 100 NPC per scenario: **normal** survived 100/100, deaths 0, market stockout days 0, homeless 0, avg health 100. **Low initial reserve** also survived 100/100, showing farm regeneration replenished stocks quickly. **Persistent famine adversarial fixture** removed both initial food and field stock+regeneration: 10/10 seeds had 30/30 daily food-stockout samples, all 100 original residents died by day 30, 0 money/resource conservation failures, 0 aid transfers from empty market. This extreme case tests valid collapse and death cleanup; it is not an intended default balance setting.
- 100 NPC at 20×: Phase 06 new browser test originally expected the word "Biến cố" after tick >110, but the intentionally bounded 120-event history has already evicted shock onset from tick 96. Corrected the test to check filter accessibility while existing Phase05 Chromium tests still check freshly emitted causal events, rather than removing or enlarging event caps.
- [Actions #38671225735 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38671225735): **84/84 Vitest**, **11/11 Chromium E2E**, production audit, TypeScript, ESLint and build PASS at feature commit `f5e886a`. [Browser screenshot artifact #11943838565](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38671225735/artifacts/11943838565) includes 100-NPC desktop 1920×1080/1366×768 and save-flow 390px mobile. Tests also verify browser quota errors, corrupted/incompatible imports, pause and tab-hidden backlog discard.
- **Browser Chromium GitHub CI**, 100 NPC at 20×, sample 45 animation frames: **25 FPS mean**, **83.3 ms p95 frame time**, one memory sample **81,400,000 bytes** JS heap. This does not certify sustained FPS or physical-device battery/thermal behavior; frames show noticeable jank, a future perf target.
- **Remaining acceptance gates:** [PR #7](https://github.com/giabao2605/Tiny-Civilization/pull/7) final-head CI pending; actual novice-player playtest **chưa thực hiện**, physical Android/desktop hardware FPS **chưa đo**. These are transparently open, so Phase 06 remains **PARTIAL/IN PROGRESS** rather than claiming every quality gate DONE.

## Phase 04 Social implementation (2026-10-14)

**Status: DONE, merged to `main` as `1a5933b74b04c32fc371f0fc3163bfed9fd5535b`.** Source branch `feat/phase-04-social` was created from Phase 03 main `73ae8f57`; [PR #5](https://github.com/giabao2605/Tiny-Civilization/pull/5) is closed/merged. Final feature SHA `f8f01ef` has [CI 38521166064](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38521166064) PASS. Next work belongs on a new Phase 05 branch from the latest `main`.

**Code added on branch:** `world.ts` schema v4 with directed sparse ties, separate home-backed household IDs, monotonic births, bounded memorials; `social.ts` validating same-tile encounter, work cooperation / actual last-unit scarcity, bounded relationship graph/events, deterministic tie and partner selection, dependant food spending, age / birth/death constraints. Integrated into `engine.ts` on the existing hourly clock, with housing assignment in `economy.ts`. React inspector now navigates relationship and household members, shows demographics / memorials and filters Social/Economy/Survival events.

**Causal fixtures/tests:** `social.test.ts` documents seeded friendship (210), exhausted-field rivalry (211), valid pairing (210), age-dependent food consumption and death cleanup; `social.benchmark.test.ts` measures 20 NPC × 180 days (seed 543), 100 NPC × 30 days (seed 613), and a 119-resident stress fixture. Additional 20/50/100 × two seeds × 30-day deterministic checks. Chromium social inspector, timeline, 20× and mobile screenshots are automated in `tests/e2e/smoke.spec.ts`. Results are pending, not assumed.

**Verified quality gate (GitHub Actions):** [run 38520425782](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38520425782) PASS clean `npm ci`, production `npm audit --omit=dev --audit-level=high`, `npm run typecheck`, `npm run lint`, full Vitest including all Phase 00–03 regressions, `npm run build`, Chromium installation and **5/5 Playwright E2E** desktop/mobile. Includes the social event actor link, relation link, timeline filters, pause/20×, repeated canvas mount and no console/asset errors. Initial [run 38519190518](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38519190518) failed new test readonly tile.x; [run 38519443307](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38519443307) failed two birth tests because a fixture advanced less than 30 days since partnership, fixed. No old tests were deleted to silence failure.

**Measured headless sessions (CI run 38520425782, Node 22 / Ubuntu, CPU runner-dependent):**
- Seed **543**, **20 NPC × 4,320 ticks / 180 days**: 27 alive, 0 dead, **11 households**, 7 dependent children, 9 partnerships, 7 births, **4,646** encounters, 272 directed edges, money **2,440** invariant, mean **0.366 ms/tick**, p95 **1.180 ms/tick**. Event graph demonstrated natural friendships and pairing while initial housing had spare capacity.
- Seed **613**, **100 NPC × 720 ticks / 30 days**: 100 alive, 0 dead, **83 households**, 17 partnerships, **1,731** encounters, **67** housing scarcity disputes, 1,335 directed edges, 0 births due to soft cap, money **12,200** invariant, mean **1.264 ms/tick**, p95 **4.562 ms/tick**. Housing expands to 100 places through wood-backed construction. Results are not browser FPS measurements.
- Seeded replay **20/50/100 × 2 seeds × 720 ticks**, 119-person hard-cap stress, social limit and food/wood/cash conservation all PASS. Existing Phase 03 ten-seed 720-tick scenarios for 20/50/100 continue PASS and money/trade/housing retain their measured invariants.
- Three explicit causal stories: seed 210 work-site repeated encounters → friendship; seed 211 actual depleted field → dispute/rivalry; seed 210 repeated positive contact over 72 hours → legal partnership/household. Further seeded case 306 verifies two homeless NPCs dispute a real housing shortage; seed 309 verifies last housing slot contention resolves deterministically by actor order.
- Screenshots saved by Playwright into GitHub Actions `test-results/` artifacts; screenshots are browser evidence, not validation on the user's physical phone. No claim of an empirical 60 FPS guarantee.

**CI debugging evidence:** The initial readonly fixture and too-short birth timeline errors were fixed and subsequent full regression + browser runs PASS. Production-only audit PASS; full dev dependency advisory status and manual mobile/FPS remain release concerns. Local authoring host cannot access npm/GitHub by DNS; execution evidence comes from GitHub Actions, not imaginary local runs.

**Limits:** Births remain deliberately capped and do not guarantee healthy childhood during food shortages. No detailed lineage, inheritance, AI conversation, government, save/load or release. Relationship history is sparse, events are capped; dead people's goods remain held to preserve accounting. Phaser remains a read-only renderer.

## Phase 03 Economy, housing and 100 NPCs (2026-10-14)

**Status: DONE, merged to `main` as `83ef46c48068e782b5bdd4a234f67d60d958808c`.** Source branch was created from Phase 02 main `0c8db616`; closed merged [PR #4](https://github.com/giabao2605/Tiny-Civilization/pull/4). Phase 04 begins only in a separate task/branch.

**Implemented and CI-verified source:**
- src/sim/world.ts: 20/50/100 deterministic worlds; unique IDs; bounded site capacities, nullable homelessness, citizens' wallets and owned goods, one market/treasury, construction records, expanded finite field/forest production nodes.
- src/sim/economy.ts: atomic buy/sell with enough funds, owned stock, location, storage capacity and live citizen checks; wood reservation at construction start, paid hourly builders and house completion.
- src/sim/engine.ts: stable ascending NPC effects; physical harvested goods enter NPC bags, travel and one-hour market trades, paid meal purchases, self-owned meals, finite builders and survival priority; events read from committed simulation.
- src/sim/balance.ts: integer prices, fixed initial cash, population-scaled map resources, node slot caps, house costs/durations and cooldowns.
- src/app/App.tsx, livingCoordinator.ts and WorldScene.ts: population choice, responsive inspectors/dashboard, wallets, trade history, builder progress, market marker and dynamically completed houses; no React/Phaser economy mutations.
- economy.test.ts, benchmark.test.ts, updated survival and browser smoke suites: conservation and failed trade tests, parallel buyers/builders, no free-food escape, 720-tick 100-NPC scenarios and Chromium 100-NPC coverage.

**Ownership:** WorldState.inventory is the sole market warehouse, distinct from each NPC's owned bag. Initial finite money supply is 122 coins per NPC: 32 wallet plus 90 market coins per resident (20/50/100 supply 2,440/6,100/12,200). Current integer prices: market buys food 2, sells 3; buys wood 1, sells 2. A spread remains in the finite market treasury and no wage/harvest mints coins. Construction consumes 8 market wood on start; builder must complete 8 funded hours paid 4 treasury coins/hour. New homes give 4 real beds.

**Verification history:** Early failures were identified and fixed (TypeScript nulls/narrowing, one ambiguous E2E selector, warehouse-last-slot deadlock). Post-circulation implementation CI [38513743348](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513743348) and latest source-plus-regression CI [38514384101](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38514384101) both PASS: clean npm ci, production dependency audit, typecheck, lint, 47 Vitest cases, production build, and 4 Playwright Chromium E2E tests. E2E stores [phase-03 browser screenshots](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38514384101/artifacts/11871206561). GH-hosted Ubuntu Actions was the execution environment; local authoring container cannot reach npm registry.

**Final 30-day baseline:** 10 seeds for EACH population (20, 50, 100), 720 ticks/seed: all 20/20, 50/50 and 100/100 alive with no invalid actions at the end of the sampled runs. Exact money conservation: 2,440 / 6,100 / 12,200. Market cash at tick 720: 20 NPC 1,096–1,120; 50 NPC 3,861–3,888; 100 NPC 8,295–8,311, all strictly finite and positive. Both market purchases and sales were nonzero in every seed: 100 NPC seeds market bought 913–929 food/wood units from citizens and sold 359–375 back to citizens; this shows a real circular trading path rather than fake HUD balances. At 100 NPC, five wood-backed houses expanded capacity from 80 to 100 and all residents had housing. Source: [CI run 38513743348](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513743348). Measured Node-only benchmark (GitHub Ubuntu Node v22.23.3): 100 NPC, 720 ticks, average 1.880 ms/tick, p95 8.691 ms/tick, 36,297 BFS calls (50.41 per tick), GC-sensitive heap delta 3,636,288 bytes. Heap sampling is not proof of a browser memory leak or of a leak-free app.

**Bugs exposed and fixed:**
1. Strict TS nullability and narrowed-literal errors from schema v3, fixed before CI.
2. Playwright ambiguous “Tạo lại” selector, fixed with exact match.
3. 50 NPC formerly died with market wood storage at 179/180: seller attempted to deposit 2 units in the last 1-unit slot, was rejected repeatedly, blocked farming and exhausted wallet. Engine now chooses a legal quantity based on free space and finite cash; a permanent regression test guards this case.
4. Worker frequently changed work nodes and lost progress; stable node preference avoids oscillation while keeping capacity limits.
5. Long-run monetary audit found little consumer purchasing because farmers ate owned harvest. Adjusted to allow safe sale of a full harvest then purchase of a meal, preserving the emergency ability to eat personally owned food. Lower wholesale prices food 2/retail 3 and wood 1/retail 2 retain market liquidity; the spread is retained in the finite market treasury. New directional cumulative commodity counters make genuine market circulation auditable. This adjustment passed the final 10-seed/population and E2E suites in CI 38513743348 and 38514384101.

**Independent review:** Phase 02 resource-contention, depleted forest rerouting, blocked workplace fallback, health rest and critical recovery regressions were restored with Phase 03 ownership semantics; the final source SHA passed 47 Vitest cases. Verified stable ID-order settlement, no magic wages, finite endowments, atomic last-unit trades, personal vs market inventory conservation, one-time material reservation, paid builder work, deceased citizens blocked from trading/building, legal construction tiles, housing capacity, bounded history, single WorldState and no simulated action from React/Phaser. No Phase 04 features added.

**Residual limitations:** Browser passed 20×/inspector E2E but numerical FPS and real-device compatibility were not benchmarked; Chromium screenshots exist in CI artifacts but were not manually visual-certified here. Heap delta is GC-sensitive, not a trustworthy leak proof. Future Phase 06 owns full persistence/save migration. No autonomous demand for purchased wood once housing construction finishes, but atomic wood purchase is supported and unit-tested. Long-term equilibrium beyond the validated 30-day horizon, additional jobs/consumers and housing maintenance are deferred unless new evidence justifies them. No hidden food/money faucets, bank, AI agents, backend, social or 3D. **PR #4 is merged; Phase 04 has not begun.**

---

## Phase 02 Survival implementation and verification (2026-10-14)

**Branch:** `feat/phase-02-survival` from main `d6420cc07c59d1a4bb70a38fa353e5eec3cafd47`. **PR:** [#3](https://github.com/giabao2605/Tiny-Civilization/pull/3), historically left open during Phase 02 work, since merged into main at `0c8db616`. Scope was limited to Phase 02.

**Shipped:** `src/sim/balance.ts` centralizes hourly rates and finite capacities; `world.ts` adds differentiated hunger/energy/health, explicit jobs, finite field/forest nodes, town inventory and cumulative/day statistics; `engine.ts` enforces a stable hourly pipeline with sorted ID-based atomic transfers, food consumption, starvation/health/death, fatigue, cooldown and source selection. Per-hour action exclusivity prevents work while moving or sleeping. Fields/forest regenerate only at day boundaries up to capacity, stock is nonnegative, and dead agents stay inert. There are no wages, money, markets, full persistence or Phase 03 mechanisms.

**UI:** React shows actual food/wood stocks, daily food produced/consumed, runway if previous-day consumption is known, hungry/endangered counts, needs bars, jobs, action durations and recent decisions. Phaser paints production-site stock/depletion markers, hides dead citizens and retains pan/zoom/selection. Events distinguish production, meals, missing food, depletion, recovery, danger and death.

**10-seed × 30-day baseline (720 ticks per seed):**

| Seed | Living | Food | Wood | Food produced | Food consumed | Deaths |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 20 | 130 | 120 | 698 | 598 | 0 |
| 2 | 20 | 132 | 120 | 698 | 596 | 0 |
| 3 | 20 | 131 | 120 | 699 | 598 | 0 |
| 4 | 20 | 131 | 120 | 698 | 597 | 0 |
| 5 | 20 | 132 | 120 | 699 | 597 | 0 |
| 6 | 20 | 130 | 120 | 697 | 597 | 0 |
| 7 | 20 | 132 | 120 | 698 | 596 | 0 |
| 8 | 20 | 127 | 120 | 693 | 596 | 0 |
| 9 | 20 | 130 | 120 | 698 | 598 | 0 |
| 10 | 20 | 131 | 120 | 698 | 597 | 0 |

All reported stocks satisfy conservation: `food = 30 initial + produced - consumed`, `wood = 6 initial + produced`. Both are additionally bounded by warehouse capacity (food 150, wood 120), while source stock is finite and renewed only within node caps. **Wood reaches its storage cap and stays unused until a later phase introduces a legitimate wood sink; this is intentional, not infinite extraction.**

**Verified CI:** [PR check run 38508978334](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38508978334) completed successfully with clean `npm ci`, production audit, `typecheck`, `lint`, 32 Vitest tests, production build and **3 Playwright Chromium tests** (desktop/mobile, pause/20×/selection/survival HUD). [Browser screenshot artifact 11868949006](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38508978334/artifacts/11868949006). Additional adversarial tests after this run cover forest rerouting, health recovery, failed meals and an individual farmer's produce→eat causal chain; check the most recent PR CI before merging.

**Shortage/depletion:** source regeneration disabled + food set to zero leads to denied meals, starvation grace, deterministic health loss and death. Last-unit food/harvest contention is resolved by ascending citizen ID without negative node or town stock. Forest depletion/refill, rerouting, 720-hour replay, 100 seed map connectivity and batch/single stepping are test-covered.

**Independent review/fixes:** initial CI failed on an obsolete test that looked for the commons event only in the final bounded 120-event tail; updated the test to observe events across all 500 ticks without weakening retention policy. Stabilized the waiting-for-food activity when pantry stock is zero, avoiding a false hourly activity flip. Confirmed one canonical `WorldState`, bounded events and per-citizen history, no `Math.random()` in gameplay and no React/Phaser resource writes. Initial food/wood are explicit endowments, not magic replenishment.

**Limits:** The authored code cannot run npm/Chromium locally because the container cannot reach the registry; all PASS claims above are based on real GitHub Actions. Browser screenshots were captured automatically; a human full-device/FPS benchmark has not been performed. There is no wood consumption sink, crop seasons, carriers, NPC personal inventory, wages, backend or save/load, by design.

**Gate:** Implemented and verified, PR #3 remains open/unmerged; Phase 03 must not begin on this branch.

## Phase 01 Living World implementation and verification (2026-10-14)

**Source branch:** `feat/phase-01-living-world` from main `4fab2da4b8cf5008a1cfb0b2443e64808238ed14`. Latest verified code commit `2d981e2b896cf03ebc16dd33da97ab6a65f31991`; later documentation-only changes do not alter behavior. Phase 00's files/tests were retained.

**Delivered:** `src/sim/{prng,world,pathfinding,engine,clock}.ts` with deterministic seeded 48×48 terrain, connected village sites, 20 uniquely identified residents, monotonic event IDs, bounded events/history, pathfinding + fallback cooldown; headless hourly state transitions; separate runtime scheduler 1×/5×/20×, hidden-tab backlog discard. React `src/app/livingCoordinator.ts`, `App.tsx`, responsive CSS; Phaser `GameCanvas.tsx`, `WorldScene.ts`, `createGame.ts` render map/sprites and selection/zoom/pan without editing state. No Phase 02 mechanics.

**Verified checks (Ubuntu GitHub Actions):** [run 38506368939](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506368939) **PASS**: `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run typecheck`, `npm run lint`, `npm run test` (**23 tests**), `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e` (**2 Chromium tests**). Browser verifies 20 NPC model count, canvas dimensions, click/inspector, pause/speed/resume, pan/zoom input, 10 events, triple remount, no console errors/asset 404, responsive 390px without horizontal overflow. Screenshots: [artifact 11868235502](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506368939/artifacts/11868235502). Earlier artifact was extracted and visually reviewed: desktop, 20× after several days, narrow view.

**Simulation regressions:** exact xorshift32 sequence; 100 valid seeds; same seed 240-hour replay, batch/single equivalence; 500 ticks in Node-only Vitest; four-way legal movement, disconnected target fallback and retry cooldown, dynamic blocked future waypoint, clock rates and gap discard. Full state remains JSON-serializable; no simulation use of `Math.random()`, Phaser or React.

**Failures discovered/fixed:** first CI type errors (unused private field/import, activity literal inference), incorrect shared-workplace test assumption, impossible-path repeated retry, invalid cached waypoint, overlapping movement tweens. Failed CI runs retained as factual debugging history; final code run is green.

**Independent self-review:** one canonical state in coordinator; stable ascending NPC IDs; renderer only reads; event count bounded to 120 and per-NPC history to 8; original Foundation coordinator/test preserved. No production/wages/survival resources or persistence added. Rendering assets are procedurally drawn; no new packages.

**Limits:** No day/night tint, true wages/production, NPC collision resolution, save/load, long-term social needs, physical-phone performance evidence. 20× tested for browser responsiveness in smoke tests, not a long-running FPS benchmark. Local authoring container cannot resolve github.com/npm, so local install/build/Chromium remains **BLOCKED**; clean GitHub Actions execution above is the actual validation source. Full development dependency advisory count from Phase 00 remains a tracked pre-release concern; production audit high-level PASS.

**Gate:** Phase 01 merged to `main` through [PR #2](https://github.com/giabao2605/Tiny-Civilization/pull/2), merge commit `88398324e1e55a2ede49b093ed85f1615055c6bf`; PR CI [38506725599](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506725599) PASS. Post-merge CI: [38507589768](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38507589768) (see linked run status). Phase 02 is the next planned phase but remains NOT STARTED.

## Phase 00 implementation handoff (2026-10-14)

**Branch:** `feat/phase-00-foundation` from main `1b44da3ad5dee1721a6b9274154f91b23165b377`.  
**Merged:** PR [#1](https://github.com/giabao2605/Tiny-Civilization/pull/1), merge commit `4c7d33e1dfe8e03c04cd0d8c5fbc6f1fe558be02`; final PR CI [38504538644](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504538644) **PASS**.  
**Purpose:** Vite + React + TypeScript strict + Phaser preview, one source of Foundation snapshot truth, inspectable tile click, mount/teardown, reproducible tests. This is NOT an autonomous simulation.

### Delivered
- `package.json`, committed `package-lock.json`, Node 22 (`.nvmrc`), npm 10, ESLint, Vitest, TypeScript, Vite and Playwright.
- React page: world canvas, placeholder HUD, tile inspector, responsive desktop/mobile layout. Phaser AUTO renders original shape-based 48×48 preview; no external runtime assets.
- Phaser `GameCanvas` boots after animation frame to avoid React StrictMode double-start; cleanup calls `game.destroy(true)`, removes prior canvas, and scene unregisters its pointer listener.
- `src/app/coordinator.ts` is the single typed Foundation snapshot/selection command owner; it rejects out-of-bounds tile selections. `src/sim/grid.ts` contains pure geometry; no time simulation yet.
- GitHub Actions: clean npm install and checks, production-dependency advisory gate, Chromium smoke, screenshot artifact. No secrets or downloaded build/cache committed.
- README updated with dev/test instructions. Original master plan, simulation contract and future phase plans preserved.

### Actual test evidence (GitHub-hosted Ubuntu runner)
- Node 22.23.3 and npm 10.9.9, GitHub Actions run [38503822373](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38503822373): `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright install --with-deps chromium` and `npm run test:e2e` all **PASS**.
- Run [38504001735](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504001735): **PASS** from committed lockfile after removing temporary bootstrap and third-party font request; smoke verified 2/2 in Chromium.
- Run [38504241274](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504241274): production dependency audit `npm audit --omit=dev --audit-level=high` PASS; same quality checks and browser smoke re-run.
- Browser: 1366×768 desktop, 390×844 narrow; one 576×576 Phaser canvas, clickable tile inspector/clear, repeated remount 3 times, visible canvas, no uncaught errors or same-origin asset HTTP >=400, no horizontal overflow. Test-saved screenshots were downloaded and visually inspected: terrain preview and panels rendered at both widths. [Screenshot artifact](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504001735/artifacts/11867880193).
- **Local execution:** BLOCKED on authoring container: `git ls-remote` fails DNS resolution for github.com, and npm package cache is empty. Local `npm ci` or Playwright run not claimed. Fresh installation, build and browser checks ran for real in GitHub Actions instead.

### Failures found and fixed
- Initial CI attempt [38503745882](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38503745882) generated the lockfile but failed to push due to a concurrent README update (non-fast-forward). Next run successfully generated/committed the lockfile; temporary bootstrap step was removed. Final CI uses plain `npm ci`.
- Removed an unnecessary external Google Fonts import to keep Phase 00 free of network-dependent assets.
- React StrictMode double-mount avoided by deferred Phaser initialization; a dedicated remount smoke test verifies single visible canvas.

### Self-review / risks
- Contract respected: `tick = 0`, `population = 0`; renderer and React never advance a simulation clock, no fake citizens, economy or seed PRNG introduced. Phase 01 must create real deterministic world state and seeded PRNG before any ticking.
- Inputs are validated, subscriber cleanup exists, Phaser scene input listener is removed on shutdown; no redundant event bus, external UI state or backend.
- `npm ci` reported **13 advisories in the full dependency graph** (1 moderate, 10 high, 2 critical). The production-only high-severity audit passed, but dev-tool advisories should be reviewed/upgraded before public release. Do not misrepresent the full audit as clean.
- CI does not prove browser behavior on the user's physical device; Chromium on Ubuntu is verified.
- No published site, no gameplay release, no Phase 01 implementation.

### Next exact action
Phase 00 was merged and verified. Next task may implement Phase 01 only after reading the master plan, simulation contract and `docs/phases/PHASE_01_LIVING_WORLD.md`; do not implement Phase 02.

## Phase 05 — Governance, Shocks & Collective Consequences (work in progress, 2026-10-14)

- Base `main` HEAD `b25007a7f19921b9431a98253abdf994eddd0885`; post-Phase04 main Actions run [38525078595](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38525078595) succeeded. Branch `feat/phase-05-governance`; draft [PR #6](https://github.com/giabao2605/Tiny-Civilization/pull/6). **Not merged.**
- New source: `src/sim/governance.ts` and `src/sim/governance.test.ts`; updated `world.ts`, `balance.ts`, `engine.ts`, `social.ts`, coordinator, UI, E2E and CI evidence artifact name.
- Mechanics present in source: deterministic term election / empty vacancy / leader replacement, sparse social support, governed finite food-in-kind transfers, crop reduction of real harvest and regeneration, worker illness affecting health and work, bounded event IDs and visible UI. `WorldState` schema v5; market stock and money remain single owners.
- Initial CI [38527129221](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38527129221) failed **TypeScript**: `Array.findLast` unavailable in the configured target. Resolved by using reverse-copy + find; later CI is required to prove this fix.
- Regression risks under active review: adversarial competition for final food, sickness recovery while starving, deterministic state digest, leader death across a social household, fixed-seed replay, long-run conservation and real Chromium E2E. Do not mark Phase 05 DONE before the latest green workflow with benchmark output and screenshots.


### Phase 05 measured evidence and self-review (on PR #6; final head verification pending)

- **Verified** [CI 38528856617](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38528856617): clean npm, production audit, typecheck, lint, **74/74 Vitest cases**, Vite production build and **6/6 Chromium E2E** PASS. Browser screenshot/trace artifact: [phase-05-browser-evidence](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38528856617/artifacts/11877097396). This is an intermediate passing commit `dd6bffa2`; subsequent commits require their own CI PASS.
- Test fixtures explicitly verify ranked leader/social support, vacancy, leader death during crisis, same-tick competing aid requests, stock zero, cooldown, invalid/stale policy, actual harvest yield/regen loss then recovery, illness HP/work-hour loss then recovery, 75-day cooldown cycles, exact amount of guardian-owned food transferred and consumed by dependent children, and a seed-612 crisis sequence with policy activation and termination. Engine still executes existing Phase00–04 regression suites.
- **Performance** from above Actions run (Node 22 Ubuntu, 720 ticks each; units milliseconds/tick; independent of UI FPS):

  | Residents | Seed | Alive | Harvest / illness incidents | Ill / recovered | Average ms/tick | p95 ms/tick |
  | --- | --- | --- | --- | --- | --- | --- |
  | 20 | 543 | 20 | 1 / 1 | 3 / 3 | 0.482 | 1.934 |
  | 20 | 613 | 20 | 1 / 1 | 3 / 3 | 0.528 | 2.012 |
  | 50 | 543 | 50 | 1 / 1 | 6 / 6 | 1.054 | 2.922 |
  | 50 | 613 | 50 | 1 / 1 | 6 / 6 | 1.390 | 4.853 |
  | 100 | 543 | 100 | 1 / 1 | 6 / 6 | 2.408 | 8.981 |
  | 100 | 613 | 100 | 1 / 1 | 6 / 6 | 2.350 | 8.658 |

- Currency remains conserved at 2,440/6,100/12,200 for 20/50/100 initial residents across these seeds. Food/wood sources/sinks reconcile exactly against market + all citizen inventories and construction wood consumption. No 720-tick baseline deaths; that is an observed scenario, not proof all shocks are harmless. Phase 04 long-run tests still simulate 20 NPC × 180 game-days and 100 NPC × 30 days.
- **Fixed faults discovered by actual tests:** (1) unsupported ES `findLast` in TypeScript target, (2) E2E incorrectly escaped leader-ID regex, (3) hungry child aid stranded because children do not eat from own bags, (4) after targeting the adult guardian correctly, they resold the donated food before feeding the child. Correct fix is to prioritize the real household meal over market resale, not weaken the assertion. Current fixture confirms the child actually eats and food conservation holds.
- **Remaining limitation:** a special shortage fixture is gated to Vite development to allow Playwright to exercise successful UI aid; this does not expose production god-mode controls. Browser screenshot evidence does not measure 60 FPS or prove behavior on physical mobile hardware. The 30–180-day simulation tests do not prove indefinite economic stability. Avoid release/save-load work until Phase 06.

### Phase 05 final verification on feature branch (2026-10-14)

- **Acceptance:** PASS on head `3c68cea0d9355fcaa36bdb574293ea368afd2180`, [GitHub Actions #38533542563](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563). Verified `npm ci`, production-only high audit, typecheck, lint, **74/74 Vitest** across 11 suites, Vite production build and **8/8 Playwright Chromium E2E**. Browser artifact: [phase-05-browser-evidence #11879336547](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563/artifacts/11879336547).
- Last E2E addition verifies **zero market reserve** through real mobile UI, with no relief and stable overall currency; companion mobile test verifies successful in-kind release with real stock decrease and cooldown. Fixtures are gated to Vite development at world construction, never to production intervention controls.
- Node 22 / Ubuntu benchmark on final verified head, population 100 × 720 ticks: seed 543 = 100 living, 1 harvest + 1 illness, 6 sick/6 recovered, 12,200 conserved currency, mean 1.515 ms/tick and p95 5.383 ms/tick; seed 613 = 100 living, 1 harvest + 1 illness, 6 sick/6 recovered, 12,200 conserved currency, mean 1.424 ms/tick and p95 5.102 ms/tick. These numbers describe simulated CPU cost, not renderer FPS.
- Real defects addressed through CI/self-review: unsupported ES array method, E2E regex, dependent child food stranded, guardian reselling child's ration. Additional adversarial governance tests cover leader death, zero candidate, same-tick double aid and depleted reserve; scheduled shock recovery; physically reduced field output and sick-worker productivity; long-seed conservation.
- Release boundary: **Phase 05 DONE on branch, [PR #6](https://github.com/giabao2605/Tiny-Civilization/pull/6) remains unmerged** until explicitly requested. Phase 06 persistence and final release remain out of scope. CI still emits third-party Node deprecation and Vite bundle-size warnings; no physical Android hardware FPS certification is claimed.

## Phase 07 — Release readiness (2026-10-15, in progress)

- Verified `main` at merge commit `efa9fa23f44f22b63c4531c2c0df96d9a5a0c37c`; [post-merge CI #38673629622](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38673629622) concluded success. Phase 06 is merged but its novice UX playtest and physical device performance gates remain open; do not mark Phase 06 DONE without that evidence.
- Branch `feat/phase-07-release` from verified HEAD; UI version `0.9.0` / unchanged `sim-v5-phase06` save; explicit reset confirmation preserving old browser slot; imported saves remount Phaser, and population selection follows imported save. Versioned package and lockstep package-lock.
- Measured-work-inspired renderer changes avoid repainting unchanged field/forest markers, walking all tweens when pause did not change, and per-frame Graphics redraw when no citizen is highlighted. **No simulation engine, RNG or save schema changes**. Phase 06 headless browser baseline: 100 NPC at 20× mean 25 FPS, p95 frame 83.3 ms over 45 frames on GitHub Ubuntu runner; after-change values must be taken from the Phase 07 CI and not presumed improved.
- CI on branch/PR/main: production dependency audit, TypeScript, ESLint, Vitest, Vite build, Chromium dev-browser regression, separate GitHub Pages `/Tiny-Civilization/` build and production-preview smoke (20/100 NPC, 1920×1080, 1366×768, 390×844, save/reload/JSON). CI artifacts include screenshots and dist; Pages deploy workflow gates deploy behind clean production tests.
- Browser-facing test coverage now includes reset confirmation/cancel and preservation of previously saved localStorage slot. Readable Vietnamese onboarding, seed/hour explanation, local-only save disclosure, GitHub Issues link and release-candidate boundaries.
- **As of authoring:** final-HEAD CI and public URL checks have not yet been confirmed. Host settings through GitHub App do not expose Pages administration. Physical Android test, independent novice playtest and long-duration physical device FPS remain NOT TESTED. Release decision **PARTIAL**, pending required gates. Branch remains unmerged; no release tag.

### Phase 07 CI diagnostics and remediation log

- Earlier candidate `fba695e5`: 84/84 Vitest passed; 11/12 Chromium E2E passed, but newly added reset acceptance test failed due over-escaped tick matching. Fixed test regex on subsequent commit, without relaxing the assertion.
- Candidate `aa5ae0f8`: dev Chromium 12 passed and 1 production-only test skipped as intended; production smoke could not start due missing `preview` npm script. Fixed in `d45205d8`.
- Candidate `d45205d8`: Pages CI reached production-preview smoke, but the canvas was absent because preview Vite base was `/` while build base was `/Tiny-Civilization/`. Fixed preview base env in `cab7ad65`. No release claim until the corrected smoke passes.
- Browser performance samples on concurrent CI runners were volatile (8–12 FPS at 100 NPC, 20×). Those are not evidence of a stable improvement over Phase 06 baseline (~25 FPS / 83.3 ms p95). Node tick p95 from the early candidate: 100 NPC 5.887 ms (GitHub Actions Linux). Later, representative final-head metrics are required before asserting an improvement. Renderer/React batching does not change engine ordering or RNG state.


## Observer Upgrade V01-C — Art Kit (2026-10-15)

- Precondition: V01-B PR #12 merged as `bffe91e9` and post-merge CI [#38711895996](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38711895996) PASS.
- Branch `feat/v01-c-art-kit`: added deterministic presentation-only terrain/art modules, six distinct building silhouettes, three foliage shapes, props, feet-based occlusion, and tests/documentation. `src/sim/` and save schema untouched.
- Screenshot and CI Chromium measurement scripts are committed; representative results and physical PC performance must be verified on final PR HEAD. **V01-C PARTIAL until those gates and visual review pass. Do not merge yet.**
- Source and acceptance report: [V01_C_IMPLEMENTATION](observer-upgrade-2026/V01_C_IMPLEMENTATION.md), [ASSET_MANIFEST](observer-upgrade-2026/V01_C_ASSET_MANIFEST.md), [V01_D_HANDOFF](observer-upgrade-2026/V01_C_HANDOFF.md).


## Observer Upgrade W02-E — v6 Runtime & Persistence (PR #20, in progress)

- Base HEAD: `00702be2d71bd062c95c6ad6ab2769cda5a84109` (W02-D, PR #19 merged).
- Branch: `feat/w02-e-v6-runtime-persistence`; PR: https://github.com/giabao2605/Tiny-Civilization/pull/20 (Draft, no self-merge).
- Implemented on branch: discriminated v5/v6 world runtime, strict versioned save/parser and canonical v5 migration; new 96×96 gameplay world, layout-driven Phaser road/entrance/POI, construction candidate validation and scene lifecycle.
- Tests added: frozen legacy SHA-256 migration/continuation, 30 seed/population 96×96 runtime cases, save roundtrip, corrupt import rollback, 96 construction/layout and CI benchmarks, Chromium production gameplay screenshots.
- QA documents: W02_E_IMPLEMENTATION, W02_E_MIGRATION_QA, W02_E_RUNTIME_QA, W02_E_VISUAL_QA, W02_E_LEGACY_REGRESSION and W02_E_HANDOFF.
- Status: **NOT VERIFIED** until the final PR HEAD passes typecheck/lint/Vitest/build/Chromium E2E/production smoke and required artifacts are reviewed. Physical Windows FPS/GPU/memory soak remains W02-F.


## Observer E04-D / E04-E (19/10/2026)

- E04-D weather visual PR #32 merged by explicit repository-owner request after locally reported visual review. Main merge commit `d099c8650fd4b1ef6d5029613cb71ab6ab38407a`; post-merge Fast CI verified success on that exact SHA. Detailed screenshot ledger remains incomplete, PC FPS/heap NOT MEASURED.
- E04-E branch `feat/e04-e-weather-reactions-audio`: adds 96×96 deterministic rain shelter choices below critical needs, explanatory citizen reason, existing pathfinding/backoff and lazy Web Audio rain/outdoors with mute/volume.
- Frozen raw v5 replay and fixtures remain unchanged. Migrated v6 48×48 and authored v6 96×96 now both use automatic owned-home rain shelters. Their post-migration trajectories can differ legitimately; exact v6 save/replay and resource conservation are tested.
- E04-E final-head Fast CI and audio/manual PC QA must be verified before calling DONE or merging. Do not start E04-F, trigger Pages or manual full browser workflows until the gate is met.


## Observer Plan 04 — E04-F Integration & Pacing Validation (2026-10-20)

- Branch: `feat/e04-f-integration-pacing-validation` created from merged E04-E `201f20c6`; E04-E post-merge [Fast CI #39350374219](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39350374219) PASS. The two original E04-F integration test files are preserved and extended.
- Source/test work: 48/96 × 20/50/100 × four seeded climates, hourly no-teleport checks, conservation accounting, v5→v6 import, deterministic replay, Node tick/route profiling; read-only development Phaser/texture/FPS/route diagnostics; manual Chromium 30-screenshot matrix (including rainy night) + 8 short profile samples; optional true 60/90/120-minute PC soak. The Full E2E manual workflow preserves `e04f-*` artifacts.
- **E04-F Fast CI on final HEAD: NOT RUN at authoring;** status must be updated only after checking GitHub run `head_sha`. Historical 329 tests passed on E04-E, not E04-F.
- **E04-F browser/headless screenshot/benchmark:** NOT RUN; **Windows PC visual/audio/GPU FPS/heap/leak and 60–120 minute soak:** NOT RUN / NOT MEASURED. Observer Pace remains explicitly optional; no claim of continuous observer animation between long ticks.
- **DoD / Plan 05 gate: PARTIAL**, review pending. No automatic merge or Pages deployment. [Implementation](observer-upgrade-2026/E04_F_IMPLEMENTATION.md) · [Integration QA](observer-upgrade-2026/E04_F_INTEGRATION_QA.md) · [Performance](observer-upgrade-2026/E04_F_PERFORMANCE.md) · [Visual/audio](observer-upgrade-2026/E04_F_VISUAL_AUDIO_QA.md) · [Handoff](observer-upgrade-2026/E04_F_HANDOFF.md).

### E04-F executed CI update (2026-10-20)

- [Fast CI #39352756469](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39352756469) **PASS** for exact code SHA `bf4bdfe7549f4cbac414d6f9bb41352b60f31adf`: 42/42 test files, **337/337 Vitest**, production audit/typecheck/lint/build all successful.
- E04-F Node 48/96 × 20/50/100 × clear/cloudy/rain/fog, 72h replay and 36h per-hour routing/tick profile PASS. 96×96/100 NPC measured Node tick P95 range **16.699–40.201 ms** across four seeded weather scenarios on GitHub-hosted Linux; **not rendered FPS**.
- This follow-up documentation commit creates a newer HEAD, so check its separate final Fast CI. Chromium E2E, Windows hardware FPS/audio and long soak still **NOT RUN**, E04-F gate still **PARTIAL**. Do not merge without explicit user approval.