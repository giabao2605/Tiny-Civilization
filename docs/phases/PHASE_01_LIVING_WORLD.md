# PHASE 01 — Living world: a watchable vertical slice

**Tóm tắt tiếng Việt:** Có bản đồ 48×48 và 20 NPC có lịch sinh hoạt, biết đi tới mục tiêu; xem được lý do hành động, pause và đổi tốc độ.

**Status:** NOT STARTED · **Requires:** phase 00 gate passed.
**Intent:** Make the first actual playable view. Twenty citizens follow understandable spatial/routine goals on a 48×48 seeded map. No survival economy yet.

## Player story / visual acceptance

The user starts seed 12345, sees a small village with paths, buildings, forest and water. Twenty named sprites travel between homes, workplaces and a communal area on schedule. Clicking anyone shows name, age, location, current goal, destination and a reason. Pause freezes **sim time**; 1×, 5× and 20× change time; zoom/pan never affects citizen decisions. A restart with the same seed repeats the same world and outcome.

## Build slices (no big-bang implementation)

### 01.1 Deterministic world factory
- [ ] Define typed world/citizen/tile/event models with unique monotonic IDs.
- [ ] Choose a simple pinned deterministic 32-bit PRNG and unit test a fixed sample output sequence.
- [ ] Implement `createWorld(seed)` with 48×48 grid, grass/forest/water/road, passability and small pre-positioned sites.
- [ ] Guarantee one connected accessible region for home/work/meeting anchors; for impossible seed placements, regenerate deterministically/fallback to known map.
- [ ] Spawn **20** distinct living citizens with stable names, ages, appearances and valid walkable positions.
- [ ] Freeze layout config and expose seed in HUD; map should render repeatably after refresh.

### 01.2 Sim engine and time
- [ ] Implement an explicit hourly `advanceOneTick` independent from Phaser game loop, maintaining tick/RNG state.
- [ ] Set 24 ticks/day, 2 tps at 1×, 10 tps at 5×, 40 tps at 20×; pause produces no ticks.
- [ ] Control elapsed realtime with accumulator and bounded per-frame work; **do not** process hidden tab backlog on resume.
- [ ] Keep stable ID ordering, single authoritatively owned state and clear event emission.
- [ ] Install developer-only state digest / seed + tick readout for deterministic comparisons.

### 01.3 Purposeful NPC movement
- [ ] Initial finite routine states: `home`, `travelToWork`, `atWork`, `travelToCommons`, `socialIdle`, `rest` (naming may vary).
- [ ] Choose home/work/communal destinations deterministically from citizen profile and hour; explicitly store reason and target.
- [ ] Use BFS or equally simple pathfinder over 4-way grid, compute route on target change; no pathfinding every animation frame.
- [ ] Walking consumes simulation time; renderer interpolates logical tile positions without moving canonical state.
- [ ] If unreachable or location deleted, record failure with reason and choose safe known reachable fallback; cap retries.
- [ ] NPC schedule and activity panel always agree: no work while asleep, no travel to unwalkable water.

### 01.4 Observe/inspect UI
- [ ] Draw terrain with recognizably different tile types and clearly visible citizens.
- [ ] Camera pan/zoom, sensible bounds, click hit-testing and selected-citizen highlight.
- [ ] React HUD: date/hour, seed, population, speed, pause/play, current selection and 10 latest events.
- [ ] Citizen inspector with identity, avatar/sprite color, current objective, location/home/work, recent activity and "why" reason.
- [ ] Event categories initially just waking, work start/finish, gathering at commons; cap feed length instead of logging every step.
- [ ] Keyboard/mouse interaction doesn't trap focus in canvas. Labels accessible even if game graphics are not.

## Validation plan / tests

- [ ] Unit: same seed/world config yields identical terrain, spawn, names and state digest after 240 ticks.
- [ ] Unit: different seeds create at least some different terrain/traits; no seed produces invalid spawn during a sample of 100 seeds.
- [ ] Unit: bounds/path obstacles; unreachable target rejects gracefully; route never crosses water.
- [ ] Unit: 20 NPCs have exactly one logical goal; at each transition goal and activity reason remain coherent.
- [ ] Integration: `N ticks` executed in batch equals `N` individual ticks from same state.
- [ ] E2E: visible 20 sprites, clickable inspector, pause tick unchanged, resume advances, 1×/5×/20× work, no duplicate canvas.
- [ ] Manual screenshot at day and night (if day/night tint exists), pan/zoom, small viewport, high speed.

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
