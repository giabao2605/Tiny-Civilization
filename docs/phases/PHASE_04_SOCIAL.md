# PHASE 04 — Relationships, households and emergent stories

**Status:** NOT STARTED · **Requires:** functioning survival + money/housing loop from phase 03.
**Intent:** Citizens remember encounters, form social ties and produce meaningful conflicts. Emergence matters more than chatty fake dialogue.

## Player story

Follow two neighboring citizens over a month. They meet while working or at the village commons, gain trust through cooperation, and one becomes a friend. A dispute over an actual failed trade or contested resource weakens trust; later decisions reflect that relationship. A household can form if eligible and capacity exists. Events explain **what happened, why, and who is affected**, instead of generating unrelated random drama.

## 04.1 Social data model, without O(N²) explosion
- [ ] Store **sparse** directed ties keyed by valid entity IDs, not a permanent 100×100 matrix for all pairs.
- [ ] Tie has bounded affinity/trust e.g. -100..100, recent reason tag and last interaction tick. Cap number of tracked strong/recent links per citizen if memory/performance requires.
- [ ] Social encounters happen only on plausible shared locations / nearby travel overlap / workplace contacts, never teleport people for interaction.
- [ ] Positive action: cooperative work, helpful transfer, peaceful chat; negative action: contested stock, rejected exchange, argument with a definable trigger.
- [ ] Avoid a global all-pairs social tick; choose a local candidate set on need- or schedule-based encounters, with cooldown and stable seeded random tie breaks.
- [ ] Provide a simple deterministic decay toward neutral **only if** relationships otherwise saturate after playtest; document formula centrally.

## 04.2 Decisions influenced by history
- [ ] Add social leisure goal when needs/work satisfied; prefer familiar positive ties and avoid dangerous negative ties with bounded random exploration.
- [ ] Track causality: event payload includes actor/target IDs, previous relation, action, resulting relation and reason code.
- [ ] Disputes cannot transfer goods, money or health unless they run through the same validated action/effect system as phase 02/03.
- [ ] Prevent contradictory outcomes: an NPC cannot simultaneously become "best friend" and "attacker" from the same single interaction without a defined sequence.
- [ ] Reaction cooldowns prevent perpetual argument loops and event-feed spam.

## 04.3 Households and demographic foundations
- [ ] Create households as simple relation/group membership, home assignment and optional partner IDs; ensure referential integrity.
- [ ] Eligible adults can pair after repeated positive interactions; no forced instant marriages based on a single chance roll.
- [ ] Births only for eligible households after explicit time/cooldown and available housing, subject to town population cap. Newborns consume resources but cannot work.
- [ ] Age on game-day progression; define work-age threshold and retirement behavior minimally. Avoid complex genetics or individual family-tree UI.
- [ ] Death removes member from current action queue, current partner assignments and household capacity. Keep compact memorial entry only.
- [ ] Long aging timelines must be tested with a headless fast-forward run; no "teen ages to adult in five days" shortcuts solely to make demos look busy.

## 04.4 Social information architecture
- [ ] NPC inspector shows top positive/negative relationships, household/home, recent interactions, reasons for current social goal.
- [ ] Events for meeting, friendship threshold, sustained rivalry, new household, birth, death and feud; use compact localization keys.
- [ ] World timeline allows filtering social vs economy/survival; clicking event focuses related living NPC (or a memorial entry if dead).
- [ ] Make relationship explanation readable without exposing raw formulas in primary UI; advanced details may be revealed in a tooltip/debug view.

## 04.5 Validation and pacing
- [ ] Choose 3–5 seeded narrative reference scenarios: work friendship, resource conflict, household formation, failed relationship, population cap.
- [ ] Run several 30–180 game-day headless sessions. Assert social events actually occur with sensible frequency and not every tick.
- [ ] Check whether the player can tell **why** each social event happened from event/inspector; if not, improve instrumentation before adding mechanics.
- [ ] Check population trend, dependent-child food cost, housing and production. Prevent birth-based exponential growth from silently bypassing resources/cap.
- [ ] Profile update complexity at 100 NPCs; a social update should not grow proportional to **all possible pairs each hour**.

## Tests / negative cases
- [ ] Relation scores clamp; missing/dead IDs cannot be new interaction targets.
- [ ] Two citizens apart cannot have a same-place interaction; an intentional remote mechanic must be separately defined.
- [ ] Repeated positive/negative interactions modify ties consistently and yield a reasoned event.
- [ ] Death mid-household cleans links; no orphaned invalid owner/partner references.
- [ ] Birth fails safely when housing full or at population cap; newborn has no job/action.
- [ ] Two households attempting same last housing slot resolve deterministically.
- [ ] Seed + commands yield identical relation graph/event digests at tick N; save interactions once persistence arrives.
- [ ] Playwright: select citizen → see relation target → click related citizen; timeline filter doesn't mutate sim.

## Exit gate

At least **three distinct emergent social stories** are reproducible with seed/test fixtures; relation/household invariants pass; baseline economy still survives. Social interaction rate is human-readable and production tick performance stays healthy.

## Explicit deferrals

No LLM conversations, text-generation costs, detailed romance, genealogical database, fully simulated childhood schooling, legal system, sexual content or arbitrary reputation propagation to the entire world.
