# V01-D → V01-E handoff

V01-D is scoped to automatic camera observation only. Branch `feat/v01-d-follow-afk` is based on V01-C merge. Follow and AFK never change the simulation or save data. Before accepting this task, inspect E2E screenshots and final CI performance evidence, verify real PC FPS / memory, and exercise NPC death, tab background, seed/load and canvas remount manually.

Files to inspect: `src/game/camera/afkDirector.ts`, `src/game/scenes/WorldScene.ts`, `src/game/GameCanvas.tsx`, `src/app/App.tsx`, camera unit tests and `tests/e2e/observer-v01-d.spec.ts`.

Open acceptance gates remain PARTIAL until measurements and visual verification are complete. V01-E must not introduce weather, new map dimensions, AI/pathfinding or save schema changes while addressing this camera handoff.

## Verified CI and outstanding review

[Run 38837917119](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38837917119) passed 96 unit and 21 E2E cases, plus build and production smoke. Screenshots were downloaded and inspected: no obvious duplicate canvas, broken responsive layout or missing selected-NPC marker in the sampled frames. AFK evidence was initially captured during transition rather than at settled shot; tests are extended to capture settled frames. Performance is still limited in headless Chromium, especially 100 NPC × 20× Follow. See [V01_D_QA](V01_D_QA.md). The acceptance gate remains PARTIAL; keep PR Draft and do not auto-merge.
