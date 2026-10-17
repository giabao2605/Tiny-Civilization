# N03-B handoff to N03-C

**Base:** merged N03-A PR #23, main commit 573acc81, post-merge CI #39014402740 PASS. **Branch:** feat/n03-b-weighted-astar-core. PR final-head CI pending; no self-merge.

N03-B introduces standalone findWeightedPath plus optional per-call stats, traversalCostX10, separate diagnostic counters. The engine still calls old BFS findPath, so no production NPC, economy/social/governance, save/load or renderer behavior changed. Integer edge cost (destination tile): main/plaza/road 10; side 11; footpath 12; grass 20; forest 25; water blocked. Heap tie-order (f,g,tileIndex). World dimensions from schema, no cache.

**N03-C owns:** switching only needed engine callsites, blockedGoal/cooldown and movement invariants, 20/50/100 NPC multiseed 30-day behavior, trading/needs/death/resource/money conservation, replay/save and deterministic event ordering, Node tick performance. Keep an explicit BFS rollback path. Do not rewrite N03-A expected goldens merely because weighted routes differ after explicit integration.

Windows physical GPU/FPS and 60–120-minute soak: PARTIAL. PC local operation is the target; deployment is unnecessary.
