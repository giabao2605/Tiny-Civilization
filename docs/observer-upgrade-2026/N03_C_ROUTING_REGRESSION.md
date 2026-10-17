# N03-C — Routing and save regression QA

## Automated coverage (new)
`src/sim/n03c.integration.test.ts` adds:
1. Default v5 and migrated v6 48×48 BFS parity, and production 96×96 actually calling weighted routing.
2. A real NPC departure in the unmodified 96×96 world whose authoritative `lastMove + route` exactly equals the deterministic weighted A* result; cost no higher than BFS, with an observed cheaper detour.
3. 96×96 20/100 NPC save/load in mid-route, identical continued state/RNG/events, no accidental input mutation.
4. 30 game-day (720 hourly ticks), three reproducible seeds `101,107,12345` for each map size `48/96` and population `20/50/100`. 48 baseline uses BFS; 96 compares both explicit BFS and weighted.
5. Per-tick cardinal route/lastMove, at most four tiles moved, passability, destination consistency, no death-revival/dead-actor movement, bounded inventory/money/needs, ordered events and on-market recorded trades.

## Existing immutable gates
- N03-A four frozen 48-tick goldens with explicit `'bfs'` compatibility (expected JSON unmodified).
- N03-A synthetic RouteBlocked/cooldown/replan tests also run with the production 96×96 strategy.
- N03-B weighted vs Dijkstra and tie-break tests; W02-F legacy BFS parity.
- Old v5 fixture byte SHA-256, v5→v6 migration, v6 roundtrip and all original unit/Chromium tests.
- No new daytime routine, weather or goal model.

## Limitations and reporting
- Dynamic water-blocked cached route tests are **synthetic**, not proof of spontaneous production deadlock.
- The 720-tick matrix counts routing requests/unreachable, blocked events, goal changes, travel/work hours and resource/economic outcomes. Counted route requests do not include `availableNode`/construction BFS reachability probes; total BFS diagnostic calls do include them.
- The real path cost example proves route choice, not a global promise that all paths are physically shorter. Weighted can use **more** tiles.
- Final-HEAD Vitest/E2E and production smoke: **PENDING evidence**. Do not promote to PASS without successful CI.
- Manual physical Windows PC, 60–120 minute soak, GPU/FPS measurement: **PARTIAL / NOT RUN**.
