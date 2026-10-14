# PHASE 01 — Living world: a watchable vertical slice

**Tóm tắt tiếng Việt:** Có bản đồ 48×48 và 20 NPC có lịch sinh hoạt, biết đi tới mục tiêu; xem được lý do hành động, pause và đổi tốc độ.

**Status:** DONE (merged to main via PR #2; PR CI PASS) · **Requires:** phase 00 gate passed.
**Intent:** Make the first actual playable view. Twenty citizens follow understandable spatial/routine goals on a 48×48 seeded map. No survival economy yet.

## Player story / visual acceptance

The user starts seed 12345, sees a small village with paths, buildings, forest and water. Twenty named sprites travel between homes, workplaces and a communal area on schedule. Clicking anyone shows name, age, location, current goal, destination and a reason. Pause freezes **sim time**; 1×, 5× and 20× change time; zoom/pan never affects citizen decisions. A restart with the same seed repeats the same world and outcome.

## Build slices (no big-bang implementation)

### 01.1 Deterministic world factory
- [x] Define typed world/citizen/tile/event models with unique monotonic IDs.
- [x] Choose a simple pinned deterministic 32-bit PRNG and unit test a fixed sample output sequence.
- [x] Implement `createWorld(seed)` with 48×48 grid, grass/forest/water/road, passability and small pre-positioned sites.
- [x] Guarantee one connected accessible region for home/work/meeting anchors; for impossible seed placements, regenerate deterministically/fallback to known map.
- [x] Spawn **20** distinct living citizens with stable names, ages, appearances and valid walkable positions.
- [x] Freeze layout config and expose seed in HUD; map should render repeatably after refresh.

### 01.2 Sim engine and time
- [x] Implement an explicit hourly `advanceOneTick` independent from Phaser game loop, maintaining tick/RNG state.
- [x] Set 24 ticks/day, 2 tps at 1×, 10 tps at 5×, 40 tps at 20×; pause produces no ticks.
- [x] Control elapsed realtime with accumulator and bounded per-frame work; **do not** process hidden tab backlog on resume.
- [x] Keep stable ID ordering, single authoritatively owned state and clear event emission.
- [x] Install developer-only state digest / seed + tick readout for deterministic comparisons.

### 01.3 Purposeful NPC movement
- [x] Initial finite routine states: `home`, `travelToWork`, `atWork`, `travelToCommons`, `socialIdle`, `rest` (naming may vary).
- [x] Choose home/work/communal destinations deterministically from citizen profile and hour; explicitly store reason and target.
- [x] Use BFS or equally simple pathfinder over 4-way grid, compute route on target change; no pathfinding every animation frame.
- [x] Walking consumes simulation time; renderer interpolates logical tile positions without moving canonical state.
- [x] If unreachable or location deleted, record failure with reason and choose safe known reachable fallback; cap retries.
- [x] NPC schedule and activity panel always agree: no work while asleep, no travel to unwalkable water.

### 01.4 Observe/inspect UI
- [x] Draw terrain with recognizably different tile types and clearly visible citizens.
- [x] Camera pan/zoom, sensible bounds, click hit-testing and selected-citizen highlight.
- [x] React HUD: date/hour, seed, population, speed, pause/play, current selection and 10 latest events.
- [x] Citizen inspector with identity, avatar/sprite color, current objective, location/home/work, recent activity and "why" reason.
- [x] Event categories initially just waking, work start/finish, gathering at commons; cap feed length instead of logging every step.
- [x] Keyboard/mouse interaction doesn't trap focus in canvas. Labels accessible even if game graphics are not.

## Validation plan / tests

- [x] Unit: same seed/world config yields identical terrain, spawn, names and state digest after 240 ticks.
- [x] Unit: different seeds create at least some different terrain/traits; no seed produces invalid spawn during a sample of 100 seeds.
- [x] Unit: bounds/path obstacles; unreachable target rejects gracefully; route never crosses water.
- [x] Unit: 20 NPCs have exactly one logical goal; at each transition goal and activity reason remain coherent.
- [x] Integration: `N ticks` executed in batch equals `N` individual ticks from same state.
- [x] E2E: visible 20 sprites, clickable inspector, pause tick unchanged, resume advances, 1×/5×/20× work, no duplicate canvas.
- [x] Manual screenshot at day and night (if day/night tint exists), pan/zoom, small viewport, high speed.

## Known tradeoffs

- Buildings may be simple one-tile structures initially. No interior simulation, collision arbitration or animation-heavy villagers.
- Initial "working" is a schedule label only; phase 02 must replace it with actual production/consumption, and UI must not imply food/wealth is already being produced.
- Avoid making NPC sprites opaque dots: shape/color or name label should allow selection and tracking.
- Target 20 citizens **actually acting** over 5 days, not 100 copies sliding randomly.

## Phase gate

- In browser, watching the game for a few minutes explains where NPCs go and why.
- Seed reproducibility, route safety, pause and speed tests pass.
- No core gameplay console errors; meaningful UI click/select works.
- Update progress and note any mismatch between this document and implementation before starting phase 02.

## Self-review questions

Can the engine run 500 ticks without browser or Phaser? Is the "same seed, same commands" promise testable? Are citizens performing visible routines rather than fake random motion? Is 20× fluid and event text still comprehensible?


## Phase 01 implementation verification (2026-10-14)

- Branch: `feat/phase-01-living-world`, branched from Phase 00 main `4fab2da4b8cf5008a1cfb0b2443e64808238ed14`.
- Last verified code SHA: `2d981e2b896cf03ebc16dd33da97ab6a65f31991`. GitHub Actions run [38506368939](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506368939): clean `npm ci`, production audit, typecheck, lint, 23 Vitest tests, production build and 2 Chromium E2E tests **PASS**.
- [Screenshot evidence](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506368939/artifacts/11868235502): desktop seed preview, 20× event inspector, 390px mobile. Screenshots from passing CI were downloaded/visually inspected via earlier passing run; Phase 01 has no day/night tint.
- TypeScript xorshift32 fixed sample and replay through 240 ticks; 100 seed connectivity/sample validation; 500 Node-only ticks and batch equality; unreachable and newly blocked paths; 1×/5×/20× and lost-focus accumulator; React/Phaser browser tests.
- Self-review fixes: strict-TS inference/import errors; limit impossible-route retries to 24 ticks; check cached future waypoints; stop obsolete sprite tweens; properly scope shared-site test expectations. No external asset pack or Phase 02 mechanics added.
- Known limits: 20 NPCs share 5 workplaces, work/social are schedule states (no resources produced); no 3D, housing interior, collision arbitration, save/load, day/night tint or physical-device benchmark. Camera and snapshots remain separate; no backend.
- Merged via [PR #2](https://github.com/giabao2605/Tiny-Civilization/pull/2), merge commit `88398324e1e55a2ede49b093ed85f1615055c6bf`, after successful feature/PR CI [38506725599](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506725599). Main merge CI [38507589768](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38507589768) records post-merge verification.
- Authoring container cannot resolve GitHub/npm; local `npm ci` / Chromium not claimed. Full tests ran on GitHub-hosted Ubuntu using checked-in lockfile.
