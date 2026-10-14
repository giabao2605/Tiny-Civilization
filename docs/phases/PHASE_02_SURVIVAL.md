# PHASE 02 — Survival, finite resources, and meaningful decisions

**Status:** NOT STARTED · **Requires:** phase 01.
**Intent:** Turn schedules into actual life. Hungry agents must acquire food or suffer; jobs have explicit production and costs. One full causal loop becomes visible.

## Player story

A farmer harvests a field, food reaches the town store, residents eat and feel better. If harvest is reduced/food is exhausted, residents show hunger, prioritize food, lose health only after sustained shortage, and news records the shortage's measured cause. Wood gatherers deplete and eventually revisit regrown woodland. A viewer can follow one food unit from production to consumption.

## 02.1 Needs and finite stocks
- [ ] Add consistent citizen `hunger`, `energy`, `health` scales, 0–100, where high is good.
- [ ] Initialize population with sensible differentiated needs, with documented daily decay (24-tick boundaries).
- [ ] Represent explicit town food/wood stocks and productive farmland/forest nodes; production has finite capacity and regeneration conditions.
- [ ] Add `eat` consuming exactly one available food unit and restoring a fixed amount of hunger; no food means unsuccessful action with meaningful fallback.
- [ ] Add rest/sleep consuming time and restoring energy; needs affect objective priority and cannot update twice in same day.
- [ ] Define prolonged severe starvation → gradual health loss → possible death; avoid instant random deaths and record cause in event log.

## 02.2 Real jobs and movement
- [ ] Minimal jobs: farmer, wood gatherer (optional carrier only if needed by stock transfers); NPCs can remain unemployed without crashing.
- [ ] Give actions cost in simulated time, valid location requirement, cooldown/production limits, output destination and failure reason.
- [ ] Implement route to valid resource nodes, work until yield, then deliver to store if storage/distance constraints apply.
- [ ] When tile depleted, pick another reachable node or rest; no indefinite loop attempting same empty patch.
- [ ] A critical hunger/health emergency may preempt work; rest and work priorities are stable with hysteresis and cooldown.
- [ ] Resolve multiple agents contending for last unit of food/wood deterministically at tick effect commit, not through visual interpolation.

## 02.3 Causality in interface
- [ ] Citizen detail: need bars, job, current goal, action cost, reason, last 5 meaningful decisions and one-click tracking.
- [ ] Village dashboard: food stock, wood stock, food production/day, consumption/day, projected food runway (explain when undefined), hunger count.
- [ ] Distinct event severity: shortage, death, recovery and resource depletion. Avoid flooding logs with repetitive chores.
- [ ] Provide seed-based dev scenario controls/tests to demonstrate healthy village vs forced food shortage.
- [ ] Make missing data visible honestly; no fake gold, wages or trading before phase 03.

## 02.4 First balance pass
- [ ] Centralize numeric needs/yields in a readable small balance constants module.
- [ ] Establish a sustainable baseline for **20** residents over **30 days** in several seeds, without hidden infinite food.
- [ ] Intentionally starve a test village and confirm observable shortages, health decline and no negative stock.
- [ ] Bound forest/field regeneration and caps; prevent free resource duplication by simultaneous harvesters.
- [ ] Track failure count for invalid actions and tune cooldowns rather than masking with an automatic unlimited refill.

## Automated tests / adversarial scenarios

- [ ] Hunger/energy clamp; no double daily decay; eating always removes an owned food unit and never from zero stock.
- [ ] Same last food unit requested by 2+ people: at most one eats; all balances nonnegative.
- [ ] Two gatherers at resource of capacity 1: at most one yield; bounded regeneration.
- [ ] Too-hungry worker prioritizes eating; when food absent, an understandable fallback rather than oscillation.
- [ ] Invalid/disconnected resource tile triggers fallback within bounded ticks.
- [ ] Dead worker does not produce, eat or enter new action/transaction.
- [ ] 20 NPCs/30 days with at least 10 different seeds: no crash, no invalid state, no pathological every-seed collapse.
- [ ] Visual QA: one tracked resident shows work → food transfer → meal → improved hunger; event feed reflects real stock changes.

## Definition of done

A 20-person settlement sustains itself for a demonstrable seed; shortage scenarios fail **meaningfully and coherently** rather than bugging out. Every action affects real canonical state. Resource/needs tests pass, docs/PROGRESS updated with a short table of observed stocks after 30 days.

## Explicitly defer

Prices, wallets, tax, shopkeepers, deep farming seasons, disease propagation, inventory of 20 goods, full dialogue, advanced crafting. If the survival loop is not interesting/legible yet, do not proceed just because the checklist has green test marks.
