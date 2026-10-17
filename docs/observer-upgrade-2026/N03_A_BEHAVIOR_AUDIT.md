# N03-A — NPC Behavior Audit (authoritative source @ main cf721343)

Scope: **Observer Upgrade 2026 / Plan 03 / N03-A only**. This is a source-grounded audit of existing code, NOT a rewrite or feature release. Reference baseline: `main@cf72134349e9ab3ea800393a96c48c3eb21923c8`, merged PR #21/#22 and [post-merge CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39009292713). Do not infer goal priority from Plan 03's aspirational diagram: follow `src/sim/engine.ts`.

## Exact authoritative tick pipeline

1. `advanceOneTick` clones owners in stable citizen ID order; advances tick and main RNG once. No Phaser work (`engine.ts:69-94`).
2. `beginGovernanceTick`, day-boundary regeneration/accounting, sorted food-aid commands, conditional housing construction and builder assignment (`:95-130`). Occupancy and dependent-guardian food commitments are derived from actual owners (`:131-152`).
3. For every living adult in ID order: age/job adjustments, hunger/rest hysteresis, market feasibility, **first-matching conditional priority**, target selection (`:153-248`).
4. New goal/destination triggers `findPath`, unreachable routes set `blockedGoal` and `retryAfterTick`; an already cached route containing a newly blocked water tile is also invalidated (`:249-287`).
5. Consume at most `BALANCE.moveTilesPerHour = 4` cardinal steps. `lastMove` starts with the previous tile, then actual steps. Arrival controls activity and effect eligibility (`:288-305`).
6. Resolve on-site actions: owned food or market purchase, sale, builder pay/construction, harvesting, home recovery, commons rest; then illness/starvation/death (`:305-441`). Social/dependent care, encounters, births, governance after-citizen impacts and shortage event follow (`:442-445`).
7. Publish final `WorldState`; UI `livingCoordinator.ts:49-57` may batch notifications at 5×/20× without skipping simulation ticks. Renderer in `WorldScene.ts:357-413` consumes `lastMove`, and snaps **presentation only** when UI snapshots skip intermediate ticks.

## Goal / priority / target / effect table

| Condition, evaluated top-down (engine.ts) | Requested goal | Destination (actual) | Arrival and failure behavior |
|---|---|---|---|
| needMode=rest **and** health≤criticalHealthThreshold (194) | home | assigned home, or commons if homeless | energy/health recovery; death handled post-action |
| needMode=food; enough harvested food and hunger>criticalHunger and market can buy it (195-199) | sell | market | transfers actual citizen goods for finite market cash; respects capacity |
| needMode=food; owns food (199) | food | current tile | eat one owned unit; stats consumed; no free market food |
| needMode=food; affordable market stock (200) | food | market | buy one unit now, eat in later eligible hour |
| needMode=food; can sell food/wood (201) | sell | market | earn cash before buying food |
| needMode=food; assigned builder in 06:00–19:59 (202-203) | build | current active construction | build with finite hourly pay |
| needMode=food; producer job otherwise (204) | work | available resource node | produce actual food/wood if reachable and stocked |
| needMode=food; nothing available (205) | home | home/commons | no magical food grant; starvation risk |
| needMode=rest, noncritical (206) | home | home/commons | rest until hysteresis thresholds |
| stocked guardian with hungry dependent (207) | home | home/commons | dependent care by `advanceDependents` needs co-location |
| ordinary market sell possible (208) | sell | market | inventory/cash conservation |
| active assigned builder during 06:00–19:59 (209-210) | build | site | paid construction |
| else schedule: work 06–17, commons 18–19, home 20–05 (211,17-19) | work / commons / home | node, commons, home | harvesting/social or rest; builder during work schedule redirects to commons |

Priority is **not** simply hunger always before commerce: food mode has conditional `sell`, `build`, `work` fallbacks. `needMode` hysteresis: food if hunger≤55, exits at hunger≥80; rest if energy≤25 or health≤30, exits with energy≥78 and health≥55 (balance.ts and engine.ts:168-175). Critical-health home precedes hunger. `work` can redirect to home when inventory cap 6, inactive producer job, no stocked node, or no reachable node (engine.ts:224-248). An assigned reachable node is preferentially preserved; alternatives sort by occupancy, Manhattan distance and node ID (`:42-63`).

## Route and animation correctness

- `pathfinding.ts:14-65` uses FIFO BFS on 4-neighbor grid; tie order **North, East, South, West**. Starts/ends beyond boundaries or on water return null; same tile returns []. Grass/forest/road are all walkable; no cost weighting or crowd collisions. `grid.ts` and `dimensionsOf` supply per-world 48/96 coordinates. Numeric BFS optimization from W02-F must remain byte-for-byte equivalent on tested paths.
- `goal` or `destination` change creates a new route. Target unreachable uses fallback home with `blockedGoal=requested`, `retryAfterTick=tick+12` and emits `routeBlocked`. Missing producer node also sets a 12-tick cooldown. Route containing water is invalidated before a step (`:213-287`).
- In each tick movement consumes up to **four** elements from the front of `route`, checking `walkable` before each. `lastMove` is a rendered path **not** a second authority. Arrivals trigger trading/food/production only if NPC is stationary that tick; motion consumes travel energy (`:288-412`).
- WorldScene interpolation is visual; at skipped UI ticks it snaps to the current authoritative world coordinate. This is not a simulation teleport. Selected camera state and offscreen culling are UI concerns, not simulation goal inputs.
- Static map water traversability is authoritative. Construction tiles are chosen by real walkability/market BFS and updated layout entrance only on completion (`economy.ts:61-151`); v6 96 layouts are validated separately.

## Gameplay dependencies: existing behavior, NOT N03-A features

| Dependency | Source of authority | Interaction with goals |
|---|---|---|
| Money/stock | `economy.ts:31-60`, `world.ts:148-150` | Atomic market transfer; no economic effect from sprite tween |
| Food/wood | `engine.ts:307-405`, `governance.ts` | One food consumed only from owner; producer yield deducted from resource node |
| Needs/death | `balance.ts`, `engine.ts:414-441` | Home rest, energy expenditure, starvation/illness, dead actor skipped in later ticks |
| Family/social | `social.ts:143-315` | Dependent feeding only co-located at home; encounters stationary and capacity-limited; new birth uses RNG after adult loop |
| Leader/shock/aid | `governance.ts`, `engine.ts:95-119,442-443` | Sorted command arbitration, actual treasury/food effects and events |
| Construction | `economy.ts:61-160` | Spends wood at start and market cash on successful builder hour; allocates housing on completion |
| UI | `livingCoordinator.ts`, `WorldScene.ts` | UI not allowed to affect offscreen path decisions |

## Audit caveats / watchlist

- A resident can remain immobile for legitimate reasons: rest, trading, eating, age<18, dead, or no path. Do not classify stillness as stuck without a seed/tick trace and unmet arrival.
- Cached-route recovery checks water invalidation, but it does **not** independently reroute an unchanged goal with an empty route and an unmet destination. This is a **code-level watchpoint**, not a reproduced production bug in the seeded matrix. Reassess during N03-C/E.
- `availableNode` can check reachability for an assigned node on repeated ticks; measure path calls, do not introduce A* or cache based on guesses.
- Event reasons are gameplay explanations, except display text/Phaser tween which is presentation. Neither day-night nor weather behavior exists in this N03-A scope.

## Source/QA handoff

See `N03_A_GOLDEN_FIXTURES.md`, `N03_A_REGRESSION_QA.md`, `N03_A_HANDOFF.md`. Keep historical v5 fixture at `tests/fixtures/legacy-v5-48x48.*` immutable. Windows machine soak remains PARTIAL and must not be mislabeled as FPS certified.
