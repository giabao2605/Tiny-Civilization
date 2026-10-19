# N03-F — Watchability and QA ledger (2026-10-19)

| Verification | Evidence | State |
| --- | --- | --- |
| N03-E post-merge CI | GitHub [#39198471157](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157), head SHA `4b815aff`, completed success | PASS (baseline only) |
| N03-F measured source commit Fast CI | [#39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967), source `b41ede71`, 278/278 Vitest; audit/typecheck/lint/build PASS | PASS on measured source; final documentation HEAD recheck required |
| 720h routing/economy matrix | [#39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967), 27 logs, paired BFS/weighted 720h each | PASS |
| 72h observer telemetry | 18 seeded observations, all movement + money/food/wood invariants | PASS (mechanics); visually sparse in 96x96 |
| 1,000h replay, synthetic blocked cooldown | 1000h state equal; 25h island without same-goal cooldown spam | PASS |
| Real canvas, Follow, Fit, 20×, Inspector | New `tests/e2e/n03f-watchability.spec.ts` | NOT RUN |
| Manual Full Chromium E2E and production smoke | `full-e2e.yml`, exact PR SHA required | NOT RUN |
| Windows machine: FPS/GPU and >=60-minute soak | Physical local PC required | NOT RUN |

## Three-game-day observer criteria
The test uses the **real engine** (not a mocked NPC script), checks every lastMove cardinal step is walkable and at most four per hour; live actors retain a reason, dead actors have no motion/route; captures work/eat/rest/market/leisure occupancy counts, movement density and A→B→A goals. The browser test pauses at >=tick 72, captures Phaser screenshots with Follow and Fit, validates inspector visibility, current save/world and console/page errors.

**Observation limits:** Telemetry can establish mechanism occurrences but does not by itself prove that a human finds routines readable or camera movement visually smooth. Visual inspection of screenshots/video and a physical Windows device is still needed. Playwright PASS alone is never a reliable claim about Windows GPU/FPS.

## Action to finish this gate
GitHub → Actions → **Tiny Civilization Full E2E (manual)** → **Run workflow** → choose **`feat/n03-f-performance-watchability`** after its final commit → run. Verify **head_sha** matches exact final commit. Read both browser test output and preserved `observer-n03-f-evidence` images/JSON in artifact. Review visual movement/console and note skipped/failed tests. Do **not** run Pages deployment for this phase.

Unverified cells remain NOT RUN, and N03-F is **PARTIAL, NOT MERGE-READY** without real browser artifacts and final-commit validation.

## Observed source results
The exact N03-F source CI [#39199969967](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39199969967) completed **SUCCESS**: 34/34 Vitest files, 278/278 tests; 0 production audit vulnerabilities, typecheck, ESLint and production build PASS. This is proof for its **source commit** `b41ede71` only. Documentation amendments on top must obtain a separate final-head CI.

On 96×96 with 100 NPCs and seeds 101, 107, 12345, first 72 hours recorded **80.8–81.4% of live NPC-hours moving** and only **79–149 atWork hours out of 7,200**. Food production was 42–45 and wood 0/20/0. Trade and eating did occur, every alive NPC retained an explanation, no illegal cardinal steps or ghost travel was found, and physical ownership balances remained conserved. There were **zero event-POI leisureIdle hours** in these three ordinary seeded 72-hour worlds. This is a real **watchability shortfall** despite correct deterministic rules.

Synthetic island run: `waitingForRoute` for 23 of 25 hours; five routeBlocked events across distinct schedule goals or retry transitions, no repeated event while the same blocked goal cooldown remained active; movement never left its isolated tile. The earlier aggregate bound of four events across a changing day/night schedule was incorrect and was replaced with the stricter, causally correct *same-active-goal cooldown* assertion, not skipped.

**Current merge gate: PARTIAL / NOT MERGE-READY.** No manual Full E2E run was dispatched by the available connector; no real Chromium screenshots/video/trace were captured and visually examined in this phase. Windows physical 20× FPS, GPU jitter and long soak remain NOT RUN. A headless Node PASS must not be presented as a player experience acceptance.

## N03-F follow-up: screenshot gate for presentational fixes

New rendering paths and instant activity tour require `tests/e2e/n03f-watchability.spec.ts` to capture `n03f-follow-before.png`, `n03f-follow-after-72h.png`, `n03f-fit-overview.png`, `n03f-activity-tour.png` and JSON observer metrics on the **final PR HEAD**. Validate that live animated 5×/20× motion has no visually apparent multi-tick teleport, no terrain crossing, no jitter/crashed canvas, and that highlighted activity comes from real NPC state. The `WorldScene` change is presentation-only, and the deterministic engine lastMove invariants are still authoritative.

`src/app/movementTrace.test.ts` verifies the actual sequential path over 24 engine ticks without altering simulation digest; `src/game/camera/afkDirector.test.ts` verifies action-first camera targeting and no dead interests. These unit checks are not a substitute for actual Phaser screenshot/video and physical Windows GPU checks.

**Until browser artifacts have been captured and read, maintain PARTIAL and NOT MERGE-READY.**
