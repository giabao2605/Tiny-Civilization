# T06-A — Architecture and ownership audit

**Source:** `main@4561660af5c55179df90b73e0d41e5f14b75eede` (2026-10-20); this is a read-only audit, not a redesign.

## Module dependency/data flow

```text
React App.tsx
  useMemo(createLivingCoordinator) -> coordinator instance holds authoritative WorldState
  useSyncExternalStore(subscribe, getUiSnapshot) <-- coherent batched read-only UI snapshot
  commands (speed / observer pace / pause / select / reset / food aid / save / import)
      -> livingCoordinator.dispatch/importSave
      -> createClock (fixed-interval elapsed accumulator; discards hidden/long gaps)
      -> advanceOneTick(previousWorld, pendingGovernanceCommands)
            -> world.ts PRNG/stable IDs and geometry (v5 48 / v6 48 or 96)
            -> engine.ts (economy, social, governance, needs, weather)
            -> routing / BFS / weightedPathfinding / layout/POIs
      -> new WorldState + pendingVisualMoves -> batched React notification
  localStorage / JSON export+import <-> save.ts validation / versioned parsing
  App.tsx -> GameCanvas.tsx -> lazy createGame.ts -> Phaser WorldScene
     snapshot copy -> terrain/site/NPC render, movement tweens, camera (fit/zoom/follow/AFK)
     WorldScene -> WeatherLayer/lighting (read world weather and tick, cosmetics)
     WorldScene -> AmbientDirector (virtual presentation delta, camera-aware ranking)
                -> AmbientVisuals (bounded display adapters)
                -> AmbientAudioBridge -> App-owned WeatherAudio WebAudio mixer
     WorldScene events -> selection/camera callbacks -> App/coordinator
     DEV ?observerPerf=1 -> Phaser FPS/delta, object/texture counters, routing/ambient diagnostics
```

### Authoritative vs. cosmetic

| Owner | Authoritative gameplay | Cosmetic / runtime |
|---|---|---|
| `src/sim/world.ts`, `world96.ts` | WorldState schema 5/6, dimensions, citizen IDs, resource ownership, map generation | None |
| `src/sim/engine.ts` + economy/social/governance/weather | Canonical hourly effects, separate gameplay and weather PRNG state, movement/decisions | None |
| `src/sim/clock.ts` | **Triggers** sequential ticks, not decision logic | Wall-time pacing, pause, tab throttling; no catch-up |
| `src/app/livingCoordinator.ts` | Only live owner of world reference, queued food-aid requests + nextRequestId; atomic swap on valid import | Timer/listeners, selected citizen, speed, observer pace, UI snapshot batching and renderPaths |
| `src/persistence/save.ts` | Strict serializable snapshot, migration/validation/8 MiB bound, pending request integrity | localStorage reading/writing itself is initiated by React |
| `WorldScene.ts`, `GameCanvas.tsx` | No permitted resource, command or PRNG mutation | Painted static geometry, citizen tweens, camera controls, weather visuals, ambient sprites, rAF/Phaser render delta |
| `AmbientDirector`, `AmbientVisuals`, `WeatherAudio` | None: must never change inventory, citizens, weatherRngState, ledger | Cosmetic seeded scheduling, pooled/bounded handles, scene-owned visuals, App-owned shared audio context |

## Lifecycle checkpoints

- `createLivingCoordinator` initializes **new worlds** via `createWorld96`; legacy 48 worlds are loaded/migrated or used in explicit governance fixtures. It holds `pending`, `nextRequestId`, `listeners`, `timer`, and both authoritative `snapshot` and batched `uiSnapshot`.
- `clock.onElapsed` filters elapsed <=0, >250 ms, hidden/paused; executes no more than 8 sequential ticks per scheduler call, never time-skips. At 5x/20x it may notify UI every 2/4 ticks, but engine still computes *every* tick. Observer 5/10/15 min/day is opt-in.
- React `GameCanvas` lazy-imports `createGame` on animation frame, constructs one Phaser.Game; ResizeObserver resizes, unmount disconnects observer/cancels rAF/destroys game/deletes debug closure. WorldScene starts `WeatherLayer`, `AmbientDirector`, `AmbientVisuals` in `create()`, registers camera/pointer/visibility listeners and shutdown handlers; geometry/load/seed changes may `scene.restart()`.
- In `WorldScene.update`, `delta` feeds ambient, lighting and rain layer only. Follow/AFK/zoom select camera view; cosmetic camera visibility influences visible vignette selection, **not** engine decisions.
- App owns `WeatherAudio` and passes `AmbientAudioBridge` via GameCanvas. Audio gesture unlock, mute/levels and lifecycle have mocked tests, **not** verified physical sound.
- Save read path: `parseEnvelope` validates original bytes, envelope, WorldState, queued commands and counter **before** any coordinator state swap; v5 migrates to schema 6 with 48×48 footprint and seeded weather; historical format 2 hydrates weather; format 3 requires validated weather. Rejected input leaves existing world and pending queue untouched.

## Architectural discrepancies and evidence

1. Plan 06 baseline text lists legacy `saveFormat=1`/`sim-v5-phase06` as if current writer uses it; actual `save.ts` writes **format 3 / sim-v6-weather** for canonical v6, while **reading** formats 1, 2 and 3. Plan is historical, source/tests are current. Do not downgrade.
2. README historical sections still describe 48×48 and older release status; active coordinator boots 96×96 by default. Documentation drift, **no gameplay change under T06-A**.
3. `livingCoordinator.start()` returns a no-op disposer to a second caller while first caller owns the timer. Repro with two `start()` leases, dispose first: common timer stops prematurely. This is a confirmed source-level lifecycle risk, **not fixed here**.
4. `?observerPerf=1` already exposes Phaser objects/textures/FPS/delta and routing/ambient diagnostics, but is DEV-only and not equivalent to end-to-end CPU/GPU/heap telemetry. Weather particle and WebAudio detailed counters remain unverified on real PC.

**Changes permitted here:** documents and isolated test instrumentation only. Code ownership/rules are unchanged.
