# N03-C — Economic, survival, social and governance QA

## Rationale
A cheaper weighted *terrain cost* path can contain more physical tiles than a shortest BFS path. Since movement remains four tiles/hour, market arrival, time working, food availability and starvation can legitimately change. **Never** reduce hunger consumption, create free food or alter market prices to hide route effects.

## Per-tick invariant checks
The new 720-tick simulation harness asserts:
- Total currency including wallets of deceased residents is conserved and market cash/wallets stay nonnegative.
- Market-owned stock + living/deceased inventory + actual recorded consumption − recorded production is conserved for food.
- Market-owned wood + citizen inventories + sunk construction wood − wood produced is conserved.
- No negative stock/capacity overrun, food/wood ownership or needs out of bounds.
- New trades occur only when the actor was alive and the NPC is on the real market tile.
- Routes remain walkable/cardinal, no water traversal/teleport or movement beyond the tick budget; previously dead actors remain inert.
- New event IDs and ticks remain ordered.

## Paired experiment
For each 96×96 population `20/50/100` and seed `101/107/12345`, run **two** 720-tick worlds with identical creation inputs and commands: BFS and Weighted A*. Log `N03C_SIM_BENCH` and `N03C_PAIRED_IMPACT`: actual trade count, food/wood produced, food consumed, failed actions, current starvation, deaths, routeBlocked, market stock/cash, average hunger, work/travel hours and goal changes. **Do not assert that different routes must give identical gameplay metrics**, only that each remains valid and deterministic with identical inputs under a fixed strategy.

Legacy 48×48 20/50/100 × three seeds × 720 ticks is separately guarded in the same harness; migrated 48 and v5 historical SHA are protected by existing regression tests.

## Interpretation gate
Results from the N03-C branch **PENDING** until CI logs are available. Any substantial starvation/death, trade or performance regression requires a specific seed, population, observed numbers and an explained decision to retain or roll back weighted routing. The mechanism is not accepted merely because invariants pass.
