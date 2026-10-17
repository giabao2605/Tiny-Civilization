# N03-B handoff to N03-C

**Base:** merged N03-A PR #23, main commit 573acc81, post-merge CI #39014402740 PASS. **Branch:** feat/n03-b-weighted-astar-core. PR #24 code commit `2d939d02` [CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39015721866) (239 Vitest, 40 Chromium E2E, 1 production smoke); docs-only follow-up final-HEAD CI must be checked. **No self-merge.**

N03-B introduces standalone findWeightedPath plus optional per-call stats, traversalCostX10, separate diagnostic counters. The engine still calls old BFS findPath, so no production NPC, economy/social/governance, save/load or renderer behavior changed. Integer edge cost (destination tile): main/plaza/road 10; side 11; footpath 12; grass 20; forest 25; water blocked. Heap tie-order (f,g,tileIndex). World dimensions from schema, no cache.

**N03-C owns:** switching only needed engine callsites, blockedGoal/cooldown and movement invariants, 20/50/100 NPC multiseed 30-day behavior, trading/needs/death/resource/money conservation, replay/save and deterministic event ordering, Node tick performance. Keep an explicit BFS rollback path. Do not rewrite N03-A expected goldens merely because weighted routes differ after explicit integration.

N03-B benchmark caveat: current weighted A* is slower than BFS in all six sampled p50/p95 microbenchmark rows on Linux Node 22, despite lower weighted travel costs. See N03_B_PERFORMANCE.md for measured values. N03-C must profile real tick-time and cost/behavior before activation, preserve an explicit BFS fallback and be ready to pause integration if frame/tick budget degrades. No A* speedup or Windows FPS claimed.

Windows physical GPU/FPS and 60–120-minute soak: PARTIAL. PC local operation is the target; deployment is unnecessary.
