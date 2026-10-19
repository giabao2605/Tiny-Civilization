# N03-F — Watchability and QA ledger (2026-10-19)

| Verification | Evidence | State |
| --- | --- | --- |
| N03-E post-merge CI | GitHub [#39198471157](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39198471157), head SHA `4b815aff`, completed success | PASS (baseline only) |
| N03-F final commit Fast CI | Compare exact PR HEAD to Actions `head_sha` | PENDING |
| 720h routing/economy matrix | Inherited `n03c.integration.test.ts`, `N03C_SIM_BENCH` | PENDING N03-F CI |
| 72h observer telemetry | New `n03f.watchability.test.ts`, `N03F_WATCHABILITY` | PENDING N03-F CI |
| 1,000h replay, synthetic blocked cooldown | New `N03F_REPLAY`, `N03F_BLOCKED_SOAK` | PENDING N03-F CI |
| Real canvas, Follow, Fit, 20×, Inspector | New `tests/e2e/n03f-watchability.spec.ts` | NOT RUN |
| Manual Full Chromium E2E and production smoke | `full-e2e.yml`, exact PR SHA required | NOT RUN |
| Windows machine: FPS/GPU and >=60-minute soak | Physical local PC required | NOT RUN |

## Three-game-day observer criteria
The test uses the **real engine** (not a mocked NPC script), checks every lastMove cardinal step is walkable and at most four per hour; live actors retain a reason, dead actors have no motion/route; captures work/eat/rest/market/leisure occupancy counts, movement density and A→B→A goals. The browser test pauses at >=tick 72, captures Phaser screenshots with Follow and Fit, validates inspector visibility, current save/world and console/page errors.

**Observation limits:** Telemetry can establish mechanism occurrences but does not by itself prove that a human finds routines readable or camera movement visually smooth. Visual inspection of screenshots/video and a physical Windows device is still needed. Playwright PASS alone is never a reliable claim about Windows GPU/FPS.

## Action to finish this gate
GitHub → Actions → **Tiny Civilization Full E2E (manual)** → **Run workflow** → choose **`feat/n03-f-performance-watchability`** after its final commit → run. Verify **head_sha** matches exact final commit. Read both browser test output and preserved `observer-n03-f-evidence` images/JSON in artifact. Review visual movement/console and note skipped/failed tests. Do **not** run Pages deployment for this phase.

Unverified cells remain NOT RUN, and N03-F is **PARTIAL, NOT MERGE-READY** without real browser artifacts and final-commit validation.
