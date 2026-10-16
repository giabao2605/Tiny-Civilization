# W02-A — Handoff to W02-B: dimension-aware core

**Task:** Observer Upgrade Plan 02, W02-A only. **Branch:** `feat/w02-a-map-schema-audit`. **PR:** [#16](https://github.com/giabao2605/Tiny-Civilization/pull/16) against `main` @ `4149442f026be2f404c249511fdbc9ad2b7f5867`. **Do not merge from this task**. Source v5 is unchanged: no world 96×96, schema version bump, additional gameplay, weather/audio, time change or renderer rewrite.

## Artifacts delivered

1. [Geometry audit](W02_A_GEOMETRY_AUDIT.md): direct and transitive consumers, fixed coordinates, risk matrix, tests/fixture/screenshot/benchmark inventory, size estimates.
2. [ADR-02](W02_A_SCHEMA_ADR.md): accepted **future** `WorldStateV6.map:{width,height}` with 48/96 supported paired sizes, dimension-aware geometry APIs, JSON `tiles` unchanged, strict v5→v6 compatibility.
3. [Legacy v5 fixture QA](W02_A_LEGACY_V5_QA.md): source code baseline from post-PR15 unmodified engine, frozen gz/base64 JSON v5 file and SHA-256 manifest, 720-tick state with nontrivial social/governance and pending real command, deterministic 96-tick continuation.
4. `src/persistence/legacy-v5.fixture.test.ts` enforces mandatory fixture existence and full-state identity; current `src/sim`, `src/game`, `src/app`, `src/persistence/save.ts` untouched.

## Exact W02-B contract

Implement dimension-aware **geometry/routing/renderer/camera wiring for legacy 48 worlds**; keep existing v5 parser/export operational. Suggested order:

1. Define `WorldDimensions`, `isValidTileAt(tile, dimensions)`, `tileIndexAt(tile,dimensions)` and decode counterpart in `src/sim/grid.ts`. Keep existing exported `isValidTile/tileIndex` as explicit 48-only compatibility helpers until callsites migrate. Do not derive width from `Math.sqrt(tiles.length)`, global mutable config or canvas size.
2. Add central `dimensionsOf(world)` accessor returning **48×48** for v5. Future v6 will use `world.map`; its type/contract is agreed but **no production v6 schema yet**. `walkable` uses world dimensions.
3. Refactor `src/sim/pathfinding.ts` encoder, BFS decode, neighbor validation and route return to use one validated dimensions value. Retain N,E,S,W ordering, 4-way water collision and deterministic shortest path for v5.
4. Refactor `src/game/render/terrain.ts`, `src/game/scenes/WorldScene.ts` worldWidth/worldHeight, Fit/Reset/clamp/Follow/AFK, scene restart when world/map geometry changes. Route `GameCanvas.tsx` resize/remount and `src/app/App.tsx` map-size label from active dimensions.
5. Refactor stale `src/app/coordinator.ts` tile selection and `src/sim/quality.benchmark.test.ts` route bound `48*48` if relevant. Check construction plot candidates in `src/sim/economy.ts` but leave legacy candidates unchanged; their 96 version belongs W02-C/D.
6. Add exact boundary and routing tests for 48/96 **synthetic dimension inputs only**: (0,0)→0, (47,47)→2303, (48,0) invalid for 48; (95,95)→9215, (96,0) invalid for 96; no overflow after row 47, valid blocked-water routing, camera 576/1152 pixel Fit math. Synthetic map helpers **do not constitute a new 96 world**.
7. Run all old save/economy/social/governance/camera tests; check `src/persistence/legacy-v5.fixture.test.ts` pinned 720→816 replay. No auto-expand of loaded saves, new default world, v6 schema/export or changed NPC logic in W02-B.

**W02-B DoD:** all mutable dimensions callsites of path/render/camera/validator-sensitive geometry use world dimensions or explicit dimensions; v5 remains exactly 48×48, frozen full save/world/end-state golden unchanged; old and new synthetic geometry tests green; visual/camera legacy regression green; CI green. A partial or hypothetical local performance number is not PASS for Windows GPU.

## Later task boundaries

- **W02-C:** v6-only deterministic 96 generator with 3 distinct districts, functional anchors/safe spawns, connected real home/work/market/resources; ten-seed matrix per 20/50/100. Keep 96 gated while persistence is incomplete; preserve old generator.
- **W02-D:** district/entrance/road subtype and >=20 decorative POIs; do not create fictional market SiteKind or silently change forest/road movement costs. Connectivity tests include hub alternate routes, not just road-color count.
- **W02-E:** strict dual parser: old `format 1 / sim-v5-phase06` → v6 metadata **48×48** only, new v6 48/96 export with version bump; migration checks full-world canonical projection, RNG/IDs/inventory, 96-tick continuation, queued policy, corrupt import atomicity and 8 MiB cap. Only after E should default reset/new-game choose 96.
- **W02-F:** map density and real performance. The headless V01-E FPS regression/uncertainty and Windows physical FPS + 60–120-minute heap/GPU soak remain OPEN by owner-approved deferral. No optimization claim in W02-A.

## Risks and unresolved decisions

| Risk / question | Current decision | Owner for follow-up |
| --- | --- | --- |
| Frozen v5 replay fails after dimension refactor | Block release; never regenerate source fixture to hide change | W02-B/E |
| Renderer still assumes 576px or restarts only on seed/population | Use actual world dimensions for scene lifecycle and camera calculations | W02-B |
| 96 procedural generator reaches POIs by decorative road but not actual passable grid | Validate real `findPath` for all living spawns/functional sites and alternate hubs | W02-C/D |
| v5 validator loosened to 96 or unknown `engineVersion` | Keep exact strict v5 code path and version-dispatched migration; reject unknown | W02-E |
| v6 envelope string `sim-v6-map`, `saveFormat:2` | ADR proposes these as **tentative constants**; decide final spelling in W02-E tests without changing old identifier | W02-E |
| Save payload grows above 8 MiB with 96, 100 NPC and social history | Measure actual UTF-8 exported size before revising limit; don't increase preemptively | W02-E/F |
| New 96 map emptiness, CPU/heap/FPS regression | Performance is NOT measured here; validate visually/benchmark in W02-F | W02-F |
| `stateDigest` omits `tiles` | Full `worldSha256` fixture is geometry-safe; do not use digest alone for migration acceptance | W02-B/E |

## Verification and gate semantics

**Verified facts:** main post-PR #15 `CI` [38861069823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861069823) and `Pages` [38861069825](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861069825) both success; W02-A initial engine/bootstrap branch `CI` [38861809236](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861809236) success, with npm ci, npm audit, typecheck, lint, Vitest, build, Chromium E2E and production release smoke. **This bootstrap run alone cannot verify frozen fixture.**

**Latest strict fixture + docs HEAD CI:** see GitHub PR #16 Checks and `docs/PROGRESS.md` for the final completion result. If pending or failing, W02-A remains **PARTIAL / NOT VERIFIED**, despite earlier green runs. Local clone/install/test commands are **NOT RUN** in this chat environment (github.com DNS unavailable); distinguish GitHub Actions runner execution from local command execution.

**May start W02-B only after** final HEAD CI with frozen fixture and strict test passes, audit/ADR/handoff reviewed, full WorldState schema and v5 deterministic continuation unchanged, and project owner approves merging W02-A PR. The next task must begin on **actual latest main after owner merge**, not on the W02-A branch by assumption.
