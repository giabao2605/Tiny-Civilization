# PHASE 02 — Survival, finite resources, and meaningful decisions

**Tóm tắt tiếng Việt:** NPC có đói, mệt, sức khỏe, làm nghề để tạo thức ăn/gỗ có giới hạn; hết tài nguyên phải gây hậu quả thật.

**Status:** DONE on feature branch (PR #3 open, not merged) · **Requires:** phase 01 (met).
**Intent:** Turn schedules into actual life. Hungry agents must acquire food or suffer; jobs have explicit production and costs. One full causal loop becomes visible.

## Player story

A farmer harvests a field, food reaches the town store, residents eat and feel better. If harvest is reduced/food is exhausted, residents show hunger, prioritize food, lose health only after sustained shortage, and news records the shortage's measured cause. Wood gatherers deplete and eventually revisit regrown woodland. A viewer can follow one food unit from production to consumption.

## 02.1 Needs and finite stocks
- [x] Add consistent citizen `hunger`, `energy`, `health` scales, 0–100, where high is good.
- [x] Initialize population with sensible differentiated needs, with documented daily decay (24-tick boundaries).
- [x] Represent explicit town food/wood stocks and productive farmland/forest nodes; production has finite capacity and regeneration conditions.
- [x] Add `eat` consuming exactly one available food unit and restoring a fixed amount of hunger; no food means unsuccessful action with meaningful fallback.
- [x] Add rest/sleep consuming time and restoring energy; needs affect objective priority and cannot update twice in same day.
- [x] Define prolonged severe starvation → gradual health loss → possible death; avoid instant random deaths and record cause in event log.

## 02.2 Real jobs and movement
- [x] Minimal jobs: farmer, wood gatherer (optional carrier only if needed by stock transfers); NPCs can remain unemployed without crashing.
- [x] Give actions cost in simulated time, valid location requirement, cooldown/production limits, output destination and failure reason.
- [x] Implement route to valid resource nodes, work until yield, then deliver to store if storage/distance constraints apply.
- [x] When tile depleted, pick another reachable node or rest; no indefinite loop attempting same empty patch.
- [x] A critical hunger/health emergency may preempt work; rest and work priorities are stable with hysteresis and cooldown.
- [x] Resolve multiple agents contending for last unit of food/wood deterministically at tick effect commit, not through visual interpolation.

## 02.3 Causality in interface
- [x] Citizen detail: need bars, job, current goal, action cost, reason, last 5 meaningful decisions and one-click tracking.
- [x] Village dashboard: food stock, wood stock, food production/day, consumption/day, projected food runway (explain when undefined), hunger count.
- [x] Distinct event severity: shortage, death, recovery and resource depletion. Avoid flooding logs with repetitive chores.
- [x] Provide seed-based dev scenario controls/tests to demonstrate healthy village vs forced food shortage.
- [x] Make missing data visible honestly; no fake gold, wages or trading before phase 03.

## 02.4 First balance pass
- [x] Centralize numeric needs/yields in a readable small balance constants module.
- [x] Establish a sustainable baseline for **20** residents over **30 days** in several seeds, without hidden infinite food.
- [x] Intentionally starve a test village and confirm observable shortages, health decline and no negative stock.
- [x] Bound forest/field regeneration and caps; prevent free resource duplication by simultaneous harvesters.
- [x] Track failure count for invalid actions and tune cooldowns rather than masking with an automatic unlimited refill.

## Automated tests / adversarial scenarios

- [x] Hunger/energy clamp; no double daily decay; eating always removes an owned food unit and never from zero stock.
- [x] Same last food unit requested by 2+ people: at most one eats; all balances nonnegative.
- [x] Two gatherers at resource of capacity 1: at most one yield; bounded regeneration.
- [x] Too-hungry worker prioritizes eating; when food absent, an understandable fallback rather than oscillation.
- [x] Invalid/disconnected resource tile triggers fallback within bounded ticks.
- [x] Dead worker does not produce, eat or enter new action/transaction.
- [x] 20 NPCs/30 days with at least 10 different seeds: no crash, no invalid state, no pathological every-seed collapse.
- [x] Visual QA: one tracked resident shows work → food transfer → meal → improved hunger; event feed reflects real stock changes.

## Definition of done

A 20-person settlement sustains itself for a demonstrable seed; shortage scenarios fail **meaningfully and coherently** rather than bugging out. Every action affects real canonical state. Resource/needs tests pass, docs/PROGRESS updated with a short table of observed stocks after 30 days.

## Explicitly defer

Prices, wallets, tax, shopkeepers, deep farming seasons, disease propagation, inventory of 20 goods, full dialogue, advanced crafting. If the survival loop is not interesting/legible yet, do not proceed just because the checklist has green test marks.

## Phase 02 execution evidence (2026-10-14)

Implemented in `feat/phase-02-survival` and proposed via [PR #3](https://github.com/giabao2605/Tiny-Civilization/pull/3), **not merged**. Test and engineering details live in [PROGRESS](../PROGRESS.md); the simulation's exact hourly order and resource transfer semantics are recorded in [SIMULATION_CONTRACT](../SIMULATION_CONTRACT.md).

- World: 20 residents, 2 finite fields, 2 finite forests, 30 initial food, 6 initial wood, village food cap 150 and wood cap 120.
- Action/time: 1 tick per hour; 2 hunger points per hour; one food per one-hour stationary meal; field/forest work takes 3 stationary hours; daily renewal is clamped to each node capacity. Hunger/energy thresholds have hysteresis; severe hunger gets a 24-hour grace then loses 3 health every 4 additional severe-hunger hours; 0 health means death and no further actions.
- [Verified baseline](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38508978334): all 10 seeds retain 20/20 living citizens after 720 hours, food stock 127–132, wood 120, food produced 693–699 and consumed 596–598, deaths 0. The detailed per-seed table is in PROGRESS.
- First passing full GitHub Actions run: 32 Vitest tests and 3 Chromium E2E tests; [screenshot artifact](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38508978334/artifacts/11868949006). Later extra tests and documentation are subject to the latest PR run before merge.
- Adversarial scenarios deliberately remove initial and regenerative food, arbitrate a last-unit meal and last-unit harvest, make a forest empty and switch to another node, verify rest priority, gated healing, starvation and death, and repeat deterministic 720-tick runs. No unlimited resource fallback was introduced.
- Self-review corrected a Phase 01 capped-event-tail assertion and prevented a waiting NPC's activity from oscillating between waiting and eating when the pantry is empty. Known limitation: Phase 02 does not consume stored wood because construction/crafting is deferred. Real-device profiling and long-term balance refinements remain future work.
