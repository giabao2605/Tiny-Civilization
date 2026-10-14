# Simulation Contract v1 — mechanics shared by all phases

**Purpose:** Prevent each coding session from inventing a different time model, data model or physics. This is a *minimal contract*, not a framework specification. Initial formulas are tunable once tests and playtests produce evidence.

## Tóm tắt dành cho chủ dự án (tiếng Việt)

Đây là bộ **luật bất biến** để AI/code ở nhiều phiên không tự bịa một cơ chế khác mỗi lần. Game tách riêng mô phỏng với phần vẽ; cùng seed và chuỗi thao tác phải ra cùng kết quả. 1 tick tương đương 1 giờ game. Tài nguyên/tiền không được âm hoặc bị dùng hai lần; NPC chết không thể hành động; lưu game phải giữ cả trạng thái bộ random để tải lại không đổi lịch sử. Mỗi phase chỉ triển khai phần luật nó cần.

## 1. Absolute rules

- Canonical `WorldState` is plain, serializable JSON-compatible data. No Phaser sprites, React components, promises, timers, maps/sets requiring special JSON support, circular references or DOM nodes.
- World evolution is an explicit pure-ish function: `advance(world, commands) -> newWorld + emittedEvents` (implementation may use controlled local mutation for performance but observable behavior must be deterministic).
- No `Date.now`, `performance.now`, `Math.random`, network calls or UI frame deltas inside decision/effect logic. Runtime scheduler alone controls whether a tick happens.
- Save includes *PRNG internal state* and all counters needed to continue deterministically, not only initial seed.
- Stable ascending entity-ID resolution order, documented conflict arbitration and monotonic event IDs. A dead entity cannot execute an action afterward.
- All resources and money have explicit sources, sinks and transfers. Stock cannot become negative or be double-spent.
- Calculate simulation decisions, resolve legal transactions, apply resulting effects, then publish one coherent snapshot.

## 2. Clock and speed

**Time unit:** 1 engine tick = 1 game-hour; 24 ticks/day; 30-day "month" for HUD summaries is an optional display abstraction; 365 days/game-year for aging.

**Realtime pacing:** 1× = 2 ticks/second; 5× = 10 ticks/second; 20× = 40 ticks/second (targets, not a guarantee under heavy load). Tick advances independent of render FPS. Paused = exactly zero ticks. Browser tab throttling must **not** silently simulate wall-clock catch-up hours; report pause/resume explicitly if needed.

- Day number = floor(tick / 24) + 1.
- Hour = tick mod 24.
- World order-of-operations is fixed and covered by regression tests.
- Pause/speed setting is runtime UI state, not a random gameplay input; explicit player world commands are timestamped at a tick boundary.
- Animation interpolation does not apply simulation effects.

Why hourly? At 1× one game-day is ~12 real seconds; at 20× ~0.6 seconds; a game-year at 20× is ~219 real seconds, *if performance sustains target pacing*. If multi-year narratives still feel too slow, add a measured batch-skip later rather than redefining the clock after saves exist.

## 3. Suggested entities: implement fields only when needed

**WorldState**:
- `schemaVersion`, `seed`, `tick`, `rngState`, `nextEntityId`, `nextEventId`
- `tiles`: fixed 48×48 terrain/walkability/resource cells; no infinite world
- `citizens`: entities indexed or array with stable `id`, consistent sort behavior
- `buildings`, `resourceNodes` as needed
- `town`: settlement stock, treasury, housing, policy, price/production metrics
- `events`: bounded recent feed (e.g. 200–500 entries), plus aggregate history counters
- `commandsApplied` or equivalent command ledger **only if** replay verification requires it; avoid endlessly storing every tick

**Citizen**:
- identity: `id`, `name`, `ageDays` or birth tick, visual appearance seed, `alive`
- location: valid walkable `tile`, optional route/target and travel progress
- needs: bounded `hunger`, `energy`, `health` (agree on 0–100 semantics; 100 = best)
- job & state: finite job enum, current `goal`, action type, time-to-complete, cooldown
- economy (phase 03): wallet nonnegative integer, small integer inventory, home/building relation
- social (phase 04): sparse relations by unique citizen IDs; family/household IDs where necessary
- deceased are removed from action scheduler immediately; keep only bounded memorial records, no ghost actors.

**Buildings/resource nodes:** stable ID, type, grid position, production capacity/storage where relevant, ownership as an ID only when phase 03 needs it.

**Events:** stable ID, tick, type, subject IDs, compact payload with reason tags, severity. Not a full prose paragraph; UI can turn reasons into Vietnamese text.

**Data hygiene:** Prefer integer resource quantities and money. Needs 0–100 clamped. Avoid floating-point cumulative economic error; if using probabilities rely only on seeded RNG. Referential integrity must be tested.

## 4. Tick pipeline (recommended fixed order)

1. Accept at most the validated commands scheduled for this tick, stable order; reject invalid/no-op without crashing.
2. Decrement timers / update daily counters at defined boundaries. Apply hunger/energy/aging at a known cadence (e.g. once per game-day) and health impacts from severe deficit.
3. For each living NPC in ascending ID: evaluate emergency needs, existing commitment, work/home/social options; choose exactly **one** goal/action. Critical needs preempt work; stable tie-break + seeded RNG.
4. Route and travel; walking across tiles consumes simulated time, not a teleport. Unreachable target fails gracefully and triggers fallback.
5. Collect requested transactions/interactions (harvest, purchase, eat, talk, sleep, tax) in a temporary effects list.
6. Resolve conflicts deterministically: check actual stock, funds, capacity and alive status **at application time**; reserve/transfer at most available quantity, then apply one authoritative effect.
7. Update aggregate town metrics, evaluate world events / policy with proper cool-downs, append reasoned event records.
8. Assert/debug-check invariants, increment tick, publish one snapshot/diff.

Exact stage ordering can be refined in phase 02 with tests, but must be **documented and stable** before save/load is implemented.

## 5. NPC goal model

Prefer a **small utility/priority system** over hardcoded random walking or sophisticated ML:

- Emergency health/safety > critical hunger > necessary rest > job commitment > social goal > leisure.
- Goals specify **why**, **where**, **duration/cost**, **preconditions** and **success/failure effects**.
- At most one active primary action per NPC, plus a bounded recent action history.
- Avoid rapid state oscillation using a minimum commitment duration / hysteresis; emergencies may preempt.
- If path impossible or an action fails, record a bounded failure reason and select safe fallback. Do not retry endlessly every frame.
- Homes/workplaces/social targets must exist before assigned; dangling references are invalid.
- **No direct wandering as the only life cycle.** Phase 01 uses simple home/work/communal goals until survival systems arrive.

## 6. Map and travel rules

- 48×48 bounded grid, 4-way adjacency, water/unwalkable cells block entry, roads may have lower travel cost later.
- Initialize world with enough connected housing, food/resource areas and public tile(s) for 20 citizens; regenerated seeds must be validated so no spawn on water/islands with no path.
- Routes use BFS initially for small uniform-cost grid; introduce A* only if profiling shows route expansion dominates. Cache a route for an active goal; recalc on change/block, not every render frame.
- Travel speed: initial balance assumption **up to 6 orthogonal tiles per simulated hour**; tune against spatial scale and work day. Renderer interpolates positions while simulation owns hourly arrival state.
- Two sprites may share a tile in v1; do not introduce expensive per-NPC collision arbitration. Buildings occupy specified blocking or enterable tiles consistently.

## 7. Resources, needs, production, economy

**First resources (phases 02–03):** food, wood and integer money. Avoid 12 goods before two balance correctly.

- Food is created by farmland/gather actions with explicit production limits / cooldown, consumed when eating. Town stock is finite.
- Wood is created by bounded woodland gathering/regrowth, consumed for construction. Regrowth should not produce more than tile/node capacity.
- Citizen need values decrease on a consistent daily schedule; eating consumes food, sleeping consumes time and restores energy. No magical full meal when stock is zero.
- Citizen death can occur after persistent severe health decline with explainable cause; never instant death from one tick of low food.
- Phase 03 allows one market clearing mechanism, NPC wallet balances and bounded prices; **not** order books or hundreds of competing shops.
- For each transaction, assert buyer funds >= charge and seller stock >= amount. Transfer ownership and money atomically; total currency changes only through separately documented explicit money-source/sink mechanics.
- No unlimited public wages or "pay everyone daily" without a reserve; use a small finite village treasury and visible transfers.
- Track food produced, consumed, stock, shortages, money circulation and approximate average happiness. Use seed-based long-run tests before pretending economy is stable.

**Balance parameters:** Keep in a small `balance.ts` module with comments and scenario tests. First tune 20-agent sustainability, then 100-agent; do not hardcode "100" into production formulas.

## 8. Social / institution mechanics

**Phase 04:** Sparse directed relationship score (e.g. -100..100) with reasons from interactions, not all-to-all scoring every tick. NPCs with repeated cooperation gain trust; theft/argument worsens it. Mutual relationships may differ. Social events reference living subjects and actual shared location/contact preconditions. Household/group links must be valid.

**Population change:** Aging progresses by game days; births only after eligible household and housing conditions, with an initial cooldown. Newborns do not immediately enter the workforce. Deaths stop actions and clean up references; more realistic demographic detail deferred.

**Phase 05:** One elected/appointed head of village and a small set of public policies, with finite treasury/reserves. Election/leadership change is triggered by clear periodic/conditional rules, not arbitrary random slogans. Shocks (crop disease, epidemic, fire or shortage) require a defined affected resource/area, duration, mitigation and recovery. Start with two shocks and one policy, add more only if readable.

**Event causality:** Store machine-readable reason tags and relevant before/after metric snapshots for notable events. UI event text must not claim a policy caused an outcome unless the mechanism actually supports that link.

## 9. Determinism and saves

- Seed creation uses a pinned PRNG algorithm (choose one simple 32-bit algorithm in phase 00/01 and lock it in tests), state advanced only through engine APIs.
- Same engine version + same initial state + same ordered commands -> identical state/event digests at tick N.
- A save records a **schema version** and actual RNG state; imports verify version, size, legal shape, bounds, references and resource constraints before replacing a running world.
- Save/load compare after split run: advance 500 ticks → save → load → advance 500; equal 1000-tick continuous-run outcome.
- Keep save data reasonably small, report storage quota errors; manual JSON export/import as backup. Never silently overwrite an unparseable save.
- Schema migrations only when real saved versions exist; initially reject incompatible versions with clear message rather than building speculative migration framework.

## 10. Invariant checklist and exact failure examples

Mandatory tests, increasingly enabled by phase:

- `tick >= 0`; RNG state valid; IDs unique; all tile positions finite integers inside map.
- Any living citizen has valid job/action enum and reachable safe fallback; deceased never work or trade.
- `0 <= need <= 100`; inventory, public stock, resource capacity and wallet/treasury are integers >= 0.
- No two operations can spend the same last food item; buying without funds fails gracefully.
- All social/household ownership IDs resolve or are explicitly null; dead persons cannot be newly selected as living transaction parties.
- Paused world remains bit-for-bit unchanged after an arbitrary number of render frames.
- Batch ticking vs one-by-one ticking yields equal state digest if commands/tick schedule match.
- Save/load restore PRNG stream, event counters, assignments and resource amounts exactly.
- 30-day scenario has no crashes, no endless impossible task loop, no runaway IDs/log growth, and no pathological death spiral in **every** test seed.
- Test negative scenarios: isolated village spawn, missing home, empty food, depleted resource, simultaneous buyers, trade partner dies, save tampered, tab loses focus, 20× + open inspector.

## 11. Observability and performance

HUD minimally exposes simulated day/time, living population, food stock, approximate food runway in days, mood, selected person, recent high-impact events and currently active speed.

Development-only inspector may show: seed, tick, FPS, tick duration, number of pathfinding calls, resource source/sink counters, invalid-action count. No heavy external telemetry.

Events capped (e.g. newest 300) and aggregate yearly/daily metrics summarized rather than storing one object per NPC per tick. Avoid ever-growing arrays. UI updates at human-readable frequency; renderer continues animating independently of simulation.

## 12. Implementation checkpoints

- Phase 01 must establish deterministic world/tick, stable IDs, map connectivity and single authoritative selection.
- Phase 02 must implement the entire resource/needs loop before claiming intelligent NPCs.
- Phase 03 tests financial conservation; document any authorized currency injection/sink explicitly.
- Phase 04/05 use the same action/effects pipeline, not a second social/government clock.
- Phase 06 fixes save format, benchmark harness, fuzz/seeds and event inspector.
- Phase 07 certifies all invariants. Never paper over failing tests by deleting the asserts.

## Phase 02: locked hourly survival resolution (2026-10-14)

Phase 02 makes the suggested pipeline exact for the survival slice without changing the one-hour tick:

1. Increment tick, switch the daily counters and regenerate each finite field/forest **once** at ticks divisible by 24 (up to node capacity).
2. Visit only living citizens in ascending, stable numeric ID order.
3. Apply hourly hunger decay exactly once, then apply hysteretic survival goal priority (food if hungry, home if critically fatigued, schedule otherwise).
4. Choose a reachable node with remaining stock; when none is usable, choose a safe home fallback and retry with a 24-tick cooldown. BFS is deterministic.
5. Move at most four cardinal tiles. Movement occupies the entire hour and excludes eating, production, sleeping and recovery during that same tick.
6. If stationary and at a valid destination, apply **one** action. Eating takes one hour and consumes one town food unit. Farming/wood gathering takes three stationary work hours and atomically transfers at most the available node stock and free warehouse capacity to the village (abstract automatic logistics, no invented courier). Home rest is one stationary hour and restores energy. Nonproductive jobs are staff shifts, without invented goods.
7. After the one action, evaluate continuous severe hunger and its health effects; only valid rested/satiated recovery may heal. A citizen whose health reaches zero becomes dead immediately and no longer performs future actions.
8. Emit causal, ID-monotonic events from committed effects. Trim events/history to their existing bounds and publish one JSON-serializable snapshot.

Contention for the same final resource unit is resolved in citizen-ID order, never by Phaser frame order. Node stocks and village stocks are integers and clamped by actual available quantity/capacity. The initial 30 food and 6 wood units are an explicit finite settlement endowment, not an ongoing faucet. Resource nodes refill only by stated finite daily regeneration; the village warehouse has hard caps. Food runway must be labelled undefined when there is no completed day's consumption sample. These phase 02 rules are intentionally independent of Phase 03 wallets, prices or trade.


## Phase 03: schema v3 economy ownership and hourly resolution (2026-10-14)

Phase 02 direct-to-town harvest and free communal meals documented above are HISTORICAL. The following Phase 03 rules supersede them. There is no migrated save format yet.

### Canonical ownership, prices and money supply

- WorldState.inventory is the market-owned physical warehouse; it is not copied into WorldState.market. Citizens individually own wallet coins and personal food/wood inventories. Harvested goods first enter producer-owned inventory, not the public warehouse.
- Each citizen starts with 32 integer coins. The market treasury starts with 90 coins per citizen. Global supply therefore equals population times 122. All wallets, including those of dead citizens, and the market treasury are counted exactly once. There is no other monetary account and no money mint/burn.
- Fixed integer prices: market buys food at 2 and sells food at 3; buys wood at 1 and sells wood at 2. The spread stays in the market treasury (not a money sink), helping retain enough finite liquidity while food producers and consumers trade. Unpaid work never creates wages. Builder wages are subtracted from the treasury and added to the builder's wallet.
- At all times the sum of the market cash and ALL citizen wallets equals initial supply. A dead person's belongings remain owned but temporarily inaccessible; no confiscation or inheritance is implemented.

### Hourly ordered effects

1. Advance the simulation clock; on a day change, reset daily counters and regenerate node stock within capacity.
2. If housing is needed and wood, a builder and a legal plot exist, create at most one active building project and remove 8 wood from market inventory exactly once.
3. Resolve living NPCs by ascending ID. Hunger decays once; urgent survival/rest preempts work. Re-evaluate only explicit goals and limited job-change cooldowns.
4. Route by four-neighbor BFS; walking up to 4 tiles takes the hour and precludes all stationary effects.
5. Harvest takes 3 stationary work hours and removes up to 3 food or 2 wood from a finite node into the producer's bag (maximum 6 units per good).
6. Selling requires the live producer at the market tile, personal units, market treasury and free warehouse space. One stationary hour atomically removes up to 3 owned units, adds them to market stock and transfers integer coins to the producer.
7. Buying requires a live buyer at the market tile, wallet funds and available stock. One stationary hour atomically transfers coins to market cash and food/wood into the buyer's bag. Acquired food cannot be eaten in the same hour; an already-owned food unit may be eaten during a stationary hour, anywhere.
8. Insufficient funds/stock/capacity causes a clean failed action, capped reason/event and retry cooldown. No free-food fallback. Evaluate prolonged hunger, recovery and death after the action.
9. Publish bounded events and one immutable-by-convention JSON-compatible canonical snapshot. React/Phaser never mutate balances.

Last-unit contention is resolved by sequential ID order and post-guard transactions, never animation/frame order.

### Housing and construction

- 20 initial homes have a fixed capacity of 4 residents each. The 20/50/100 population presets deterministically assign occupants; excess NPCs explicitly have a null homeId and can rest at the commons. Houses are not added when citizens spawn.
- Only free, walkable, connected, non-overlapping plots may be selected. One active construction project at a time. Starting it removes 8 physical market wood units; it cannot be started twice with the same stock.
- A living builder reaches the plot and works in stationary 1-hour units. Each hour advances only if 4 existing market coins are paid to the builder. An interrupted project retains sunk wood and accumulated progress; a dead builder can be replaced by the next eligible living builder.
- At 8 funded build hours, the project completes, one capacity-4 home is created and at most four homeless living residents receive a real houseId. Demolition/births/deep ownership are deferred.

### Invariant equations and diagnostics

- Market food + sum of citizen-owned food = initial market food + cumulative harvest − cumulative food eaten.
- Market wood + sum of citizen-owned wood + sum of construction woodSpent = initial market wood + cumulative wood harvest.
- Market cash + sum of citizen wallets = initial money supply.
- All balances are nonnegative integers; occupied per house never exceeds capacity. IDs are unique and monotonically allocated across all entities.
- No DOM, game-engine clock or performance counter affects these results. Optional pathfinding diagnostics are observational only. State digests cover market, construction and housing alongside existing citizen/resource state.

**Circulation review:** A farmer with a full three-unit harvest may sell it first when safely nourished, then purchase a meal using the obtained coins. An already-purchased one-unit meal is eaten rather than re-sold, and critical hunger always permits immediate consumption of owned food. The warehouse may become full and forbid further purchases from producers; producers then lawfully consume privately owned harvest without conjuring free market food. Two monotonic counters (market.boughtFromCitizens and market.soldToCitizens) measure actual commodity units in both directions, making zero-consumer-trade deadlocks observable.
