# N03-E — Path recovery and future shelter input

**Base:** `main@7e8c49bb` (N03-D PR #26 merge, 2026-10-19). **Branch:** `feat/n03-e-path-recovery-fast-ci`, PR #27. **No merge to main.**

## Audit: previously present
- `blockedGoal`, `retryAfterTick`, `routeBlocked` and a first-pass home fallback already existed in `src/sim/engine.ts`.
- `resolvePath` retains guarded time-first weighted A* on 96×96 and original BFS on legacy 48×48, including exact 4-step-hour checkpoints and fallback semantics. `availableNode` retains BFS reachability tests.
- `Citizen.route`, `destination`, `lastMove`, `reason`, and Inspector were already present. N03-D event-only POI policy is unchanged.
- **Actual gap:** if both attempted destination and home were unreachable, the old code silently replaced the route with `[]`, still reported travel/home rest, and could retry/report excessively on successive changes. Invalid routes could also leave a stale unreachable destination.

## Small corrective implementation
1. The existing routing branch now calls `reachableFallback` **only after failure**. It probes home first, then commons, honoring actual path reachability. If neither is reachable, it chooses the current walkable tile (zero-step nearest safe location), never teleports, and marks `waitingForRoute`. If synthetic flooding makes even the current tile invalid, the NPC still stays put; no fabricated traversable route.
2. On blocked goals, save-compatible `blockedGoal`/`retryAfterTick` are the single cooldown authority. Isolated NPCs do not re-probe inaccessible homes each cooldown tick, nor repeat a `routeBlocked` event before retry. A new survival/economic goal can preempt previous blocked work; after bounded cooldown, current goal pathfinding retries.
3. In-flight cached routes are checked for water, invalid first-hop adjacency and flooded current tile before movement; the move loop independently checks each step is walkable and cardinal-adjacent. `BALANCE.moveTilesPerHour` and `lastMove` keep previous semantics.
4. `waitingForRoute` is a new *activity enum value*, not a second state machine or a new field: no phantom home energy restore, false arrival, construction, production or social interactions. Death clears blocked route state. The Inspector exposes human-readable reason and time until next retry.
5. **Shelter hook only:** optional fourth `advanceOneTick(world, commands, strategy, {citizenIds})` argument, exported as `ShelterRequest`, may redirect optional commons/idle-staff hours home. Real hunger, urgent rest, trade, harvesting, construction and government commands remain ahead of it. There is no rain/storm/weather clock, new PRNG, persisted shelter field or changed save format. Future Plan 04 must supply the same explicit shelter request on replay ticks for deterministic replay. A resident without a home uses existing commons mapping. Weather while actively farming remains intentionally outside this adapter.

## Preservation boundaries
- 1 tick = one hour, no rendering authority; no `Math.random`/wall clock logic; no standalone navigation or shelter state machine.
- v5 (48×48) and v6 (96×96/migrated 48×48) save envelopes preserved, with one added supported Activity value in the existing validator.
- No economy, market, governance, social graph, world generation, golden fixtures, N03-C weighted algorithm or N03-D leisure timing changes.
- Browser E2E remains in source but is **not an automatic merge gate**. See [Fast CI guide](CI_FAST_AND_MANUAL_E2E.md), [QA](N03_E_RECOVERY_QA.md), [performance](N03_E_PERFORMANCE.md), [handoff](N03_E_HANDOFF.md).
