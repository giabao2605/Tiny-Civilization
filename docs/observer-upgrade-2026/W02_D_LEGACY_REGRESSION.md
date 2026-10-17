# W02-D — Legacy v5 safety and regression

**Status:** PENDING final PR HEAD CI. Do not interpret added tests as executed PASS.

No changes to src/sim/world.ts, grid.ts, pathfinding.ts, engine.ts, economy.ts, social.ts, governance.ts, src/persistence/save.ts, src/game/scenes/WorldScene.ts or production coordinator/App. The only simulation integration is in the **isolated** world96 generator. Production continues to use schemaVersion 5, 48×48, strict v5 save format 1, engine sim-v5-phase06.

Unchanged gameplay rules include one simulated hour per tick, 1×/5×/20×, NPC goal FSM, money and goods ownership, household/social state, elections, shocks and old seeded PRNG. No implicit W02-E work.

Frozen files must not change: tests/fixtures/legacy-v5-48x48.json.gz.b64 and tests/fixtures/legacy-v5-48x48.expected.json. Existing tests verify full-world SHA-256, strict v5 import, split-run deterministic tick 720→816, economy conservation and social/governance invariants. Existing camera and production Chromium E2E must pass; new harness additionally asserts the actual production UI still reports 48×48.

| Test gate | Status |
| --- | --- |
| Full-world v5 SHA-256 and tick 720→816 | PENDING |
| Economy, social, governance, camera | PENDING |
| Typecheck, lint, unit, build, Chromium E2E, smoke | PENDING |
| Active v6 game and v6 persistence | NOT RUN (W02-E) |
| Windows FPS/GPU soak | NOT RUN (W02-F) |

W02-C post-merge CI 38880855077 and Pages 38880855112 were in_progress at first review. Verify conclusions before treating that baseline as clean.
