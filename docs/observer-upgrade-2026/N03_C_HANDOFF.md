# N03-C — Handoff to N03-D (conditional)

## Input
N03-B PR #24 merged as `main@a95dc075`, post-merge [CI #39018629697](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39018629697) **PASS**. N03-C branch: `feat/n03-c-weighted-routing-integration`.

## Implementation boundary
- 96×96 v6 production selects deterministic Weighted A* for all NPC **movement** routing (work/home/market/commons/construction and fallback/replan).
- Historic 48×48 v5/migrated v6 remains BFS. `advanceOneTick(...,'bfs')` is explicit whole-engine rollback.
- Work-node and construction reachability stay BFS probes; NPC goals, cooldown, energy, economic transaction authority, social and governance remain unchanged.
- No UI, day/night, weather, shelter, new social/leisure routines, new buildings, save schema, backend or worker.
- N03-A frozen expected baseline retained. New 720-tick multiseed + paired runtime metrics live in N03-C tests. Windows hardware always **PARTIAL** until run on the physical target.

## Handoff conditions
**Do not begin N03-D** until N03-C final HEAD CI (typecheck, lint, unit, build, real Chromium and production smoke) is PASS, weighted routes are proven on real NPCs, economics/survival discrepancies have been reviewed, and the owner has reviewed/merged the PR. No self-merge.

## N03-D scope, when accepted
Readable leisure/social routines and purposeful visits using existing POIs; retain emergency needs, work/economy priority and actual social-interaction triggers. Add seed-stable route/replay QA for new routines; do not extend N03-C routing into weather, shelter or path-recovery feature scope.

## Critical corrective gate, 2026-10-19
The initially green PR #25 full CI did **not** establish gameplay readiness. Pure terrain-optimal A* increased deaths and reduced trade/food production in a 720-hour real simulation. N03-C now uses shortest **simulated travel time** (minimum number of steps at unchanged 4 tiles/hour), breaking shortest-path ties by terrain cost. Original N03-B `findWeightedPath` is unchanged at its public interface. The new QA asserts no worsening deaths, food production, or market trades across nine 96×96 paired 720-hour scenarios, plus independent lexicographic Dijkstra correctness. **Do not hand off to N03-D or merge** without green final HEAD CI and inspected paired benchmark logs.
