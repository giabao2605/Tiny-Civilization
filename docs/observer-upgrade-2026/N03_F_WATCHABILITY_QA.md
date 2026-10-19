# N03-F — Watchability and QA ledger (2026-10-19)

| Verification | Evidence | State |
| --- | --- | --- |
| N03-E post-merge CI | GitHub [#39198471157](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157), head SHA `4b815aff`, completed success | PASS (baseline only) |
| N03-F final PR HEAD Fast CI | [#39206062733](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39206062733), head `6a7ec114`, 281/281 Vitest; audit/typecheck/lint/build PASS | PASS on final source and diagnostics (earlier documentation-only amendments require another green HEAD) |
| 720h routing/economy matrix | [#39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967), 27 logs, paired BFS/weighted 720h each | PASS |
| 72h observer telemetry | 18 seeded observations, all movement + money/food/wood invariants | PASS (mechanics); visually sparse in 96x96 |
| 1,000h replay, synthetic blocked cooldown | 1000h state equal; 25h island without same-goal cooldown spam | PASS |
| Real canvas, Follow, Fit, 20×, Inspector | Optional manual `tests/e2e/n03f-watchability.spec.ts` | NOT RUN (non-blocking) |
| Manual Full Chromium E2E and production smoke | `full-e2e.yml`, opt-in only | NOT RUN (non-blocking) |
| Windows machine: FPS/GPU and >=60-minute soak | Physical local PC required | NOT RUN |

## Three-game-day observer criteria
The test uses the **real engine** (not a mocked NPC script), checks every lastMove cardinal step is walkable and at most four per hour; live actors retain a reason, dead actors have no motion/route; captures work/eat/rest/market/leisure occupancy counts, movement density and A→B→A goals. The browser test pauses at >=tick 72, captures Phaser screenshots with Follow and Fit, validates inspector visibility, current save/world and console/page errors.

**Observation limits:** Telemetry can establish mechanism occurrences but does not by itself prove that a human finds routines readable or camera movement visually smooth. Visual inspection of screenshots/video and a physical Windows device is still needed. Playwright PASS alone is never a reliable claim about Windows GPU/FPS.

## Fast CI acceptance and optional diagnostics
N03-E explicitly moved Chromium out of required checks. **Do not require manual Full E2E to review/merge N03-F.** The 720h matrix, 72h telemetry, 1,000h replay, numerical evidence and 281-unit-test final Fast CI run constitute this code/diagnostic PR's accepted automated gate. A future optional Chromium run can capture visual artifacts, but is not a requirement and was NOT RUN. Do not silently deploy Pages. Windows-specific FPS and experiential watchability remain **NOT VERIFIED / PARTIAL**, not PASS.

## Observed source results
The exact N03-F source CI [#39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967) completed **SUCCESS**: 34/34 Vitest files, 278/278 tests; 0 production audit vulnerabilities, typecheck, ESLint and production build PASS. This is proof for its **source commit** `b41ede71` only. Documentation amendments on top must obtain a separate final-head CI.

On 96×96 with 100 NPCs and seeds 101, 107, 12345, first 72 hours recorded **80.8–81.4% of live NPC-hours moving** and only **79–149 atWork hours out of 7,200**. Food production was 42–45 and wood 0/20/0. Trade and eating did occur, every alive NPC retained an explanation, no illegal cardinal steps or ghost travel was found, and physical ownership balances remained conserved. There were **zero event-POI leisureIdle hours** in these three ordinary seeded 72-hour worlds. This is a real **watchability shortfall** despite correct deterministic rules.

Synthetic island run: `waitingForRoute` for 23 of 25 hours; five routeBlocked events across distinct schedule goals or retry transitions, no repeated event while the same blocked goal cooldown remained active; movement never left its isolated tile. The earlier aggregate bound of four events across a changing day/night schedule was incorrect and was replaced with the stricter, causally correct *same-active-goal cooldown* assertion, not skipped.

**Current automated code gate: PASS (final-head CI #39206062733)**, with outstanding non-blocking visual/physical quality uncertainty. No manual Full E2E screenshots/video/trace were captured. Windows physical 20× FPS, GPU jitter and long soak remain NOT RUN. A headless Node PASS must not be presented as a player experience acceptance.

## N03-F follow-up: optional screenshot diagnostic for presentational fixes

When explicitly requested, the optional `tests/e2e/n03f-watchability.spec.ts` can capture `n03f-follow-before.png`, `n03f-follow-after-72h.png`, `n03f-fit-overview.png`, `n03f-activity-tour.png` and JSON observer metrics on the **final PR HEAD**. Validate that live animated 5×/20× motion has no visually apparent multi-tick teleport, no terrain crossing, no jitter/crashed canvas, and that highlighted activity comes from real NPC state. The `WorldScene` change is presentation-only, and the deterministic engine lastMove invariants are still authoritative.

`src/app/movementTrace.test.ts` verifies the actual sequential path over 24 engine ticks without altering simulation digest; `src/game/camera/afkDirector.test.ts` verifies action-first camera targeting and no dead interests. These unit checks are not a substitute for actual Phaser screenshot/video and physical Windows GPU checks.

**Overall physical/visual watchability stays PARTIAL/NOT VERIFIED until human PC evaluation; absence of Chromium artifacts never blocks PR merge under the established Fast CI policy.**
