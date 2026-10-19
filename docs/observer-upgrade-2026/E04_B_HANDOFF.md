# E04-B → E04-C Handoff

**Entry verified:** `main@90fe91292d4a20f6f747928f5ab81ec9422cccfb`, PR #29 merged; [Fast CI #39213160232](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39213160232) SUCCESS.  
**Branch:** `feat/e04-b-day-night-lighting`. **PR not to be auto-merged.**  
**Status:** Implementation + automated Fast CI need final SHA confirmation in PR. Visual acceptance **PARTIAL** pending physical/browser review.

## What E04-C inherits
- `src/game/render/lighting.ts` exports `lightingAtHour`, `lightingAtTick`, `approachLighting` and pure window/street geometry. All current light state is derivable from canonical `world.tick`.
- `WorldScene.setSnapshot` alone retargets atmosphere; no sky scheduler or new gameplay RNG. Scene textures are regenerated on restart and cleaned at shutdown. Camera, NPC click selection and observer renderPaths are not inputs to lighting.
- Legacy 1×/5×/20×, opt-in Observer 5/10/15 minutes, v5 48×48 and v6 96×96, economy/save/goldens remain unchanged.
- Do not move weather logic into Phaser. Weather state/RNG and save migration belong to **E04-C** as deterministic `src/sim` state; `WorldScene` should eventually consume a validated weather snapshot to *modify* these presentation parameters at E04-D, not introduce a parallel visual weather clock.
- No E04-D particle/wetness, E04-E shelter/umbrella/audio, Plan 05 general event scheduler, engine rewrite or Pages deployment in E04-B.

## Open verification
- Automated lighting unit+geometry/regression in Fast CI: see E04-B PR checks on the final head commit; never cite older checks.
- Optional 4 phases × 2 map sizes × 3 viewports, pause/resume/hidden, scene restart, 20×/observer transitions and physical-PC FPS: **NOT VERIFIED**; leave visual gate PARTIAL and observer pace default OFF. Recheck aesthetic contrast and visibility when zoomed out.
- `scheduledGoal` runs 06–18 work, 18–20 commons and otherwise home, without gameplay edits. Treat very long 96×96 NPC commutes as existing Plan 03 issue, not a lighting defect.

## Suggested fresh E04-C execution task

> **Tiny Civilization — E04-C Deterministic Weather State & Save.** Preflight newest `main`, confirm E04-B PR merged and exact post-merge Fast CI PASS. Read Simulation Contract, Plan 04, E04-A clock ADR, E04-B implementation/handoff, `world.ts`, `engine.ts`, `clock.ts`, `livingCoordinator.ts`, `save.ts`, `WorldScene.ts`, `lighting.ts`, golden/replay/migration tests. Branch `feat/e04-c-weather-state` from current `main`. Implement E04-C **only**: clear/cloudy/rain/fog seeded tick-driven weather with bounded transitions, weather-only RNG and safe v5/v6 save migration; no E04-D particles/wetness, E04-E behavior/audio, Plan 05 ambient or backend. Preserve 1 tick=1 hour, pause/hidden, legacy+Observer rate presets, economic PRNG, money/food/wood conservation and previous golden fixtures. Add transition, long seeded replay, malformed import atomicity, saved RNG continuations, v5/48 and v6/96 compatibility tests. Run npm ci/audit/typecheck/lint/test/build, inspect exact final-head Fast CI. Update PROGRESS, ADR, handoff, open PR only; do not auto-merge, run optional Full E2E/Pages or claim hardware visuals without evidence.
