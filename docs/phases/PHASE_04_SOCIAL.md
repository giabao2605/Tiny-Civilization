# PHASE 04 — Relationships, households and emergent stories

**Tóm tắt tiếng Việt:** NPC ghi nhớ quan hệ, kết bạn/mâu thuẫn, lập hộ gia đình, sinh/lão/tử theo luật hợp lý; tránh drama ngẫu nhiên vô căn cứ.

**Status:** IMPLEMENTED, exit gate verified by [GitHub Actions CI 38520465893](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38520465893); [PR #5](https://github.com/giabao2605/Tiny-Civilization/pull/5) awaiting independent review, **not merged** · **Requires:** merged Phase 03 economy.
**Intent:** Citizens remember encounters, form social ties and produce meaningful conflicts. Emergence matters more than chatty fake dialogue.

## Player story

Follow two neighboring citizens over a month. They meet while working or at the village commons, gain trust through cooperation, and one becomes a friend. A dispute over an actual failed trade or contested resource weakens trust; later decisions reflect that relationship. A household can form if eligible and capacity exists. Events explain **what happened, why, and who is affected**, instead of generating unrelated random drama.

## 04.1 Social data model, without O(N²) explosion
- [x] Store **sparse** directed ties keyed by valid entity IDs, not a permanent 100×100 matrix for all pairs.
- [x] Tie has bounded affinity/trust e.g. -100..100, recent reason tag and last interaction tick. Cap number of tracked strong/recent links per citizen if memory/performance requires.
- [x] Social encounters happen only on plausible shared locations / nearby travel overlap / workplace contacts, never teleport people for interaction.
- [x] Positive actions: verified shared workplace and commons conversations; negative actions: actual depleted resources and undersupplied household capacity. NPC-to-NPC gifts are deferred because no validated direct peer transfer yet.
- [x] Avoid a global all-pairs social tick; choose a local candidate set on need- or schedule-based encounters, with cooldown and stable seeded random tie breaks.
- [x] Conditional design decision: no automatic decay until actual playtests demonstrate undesirable saturation; all affinity/trust capped at ±100 and outgoing edges capped at 20.

## 04.2 Decisions influenced by history
- [x] Add social leisure goal when needs/work satisfied; prefer familiar positive ties and avoid dangerous negative ties with bounded random exploration.
- [x] Track causality: event payload includes actor/target IDs, previous relation, action, resulting relation and reason code.
- [x] Disputes cannot transfer goods, money or health unless they run through the same validated action/effect system as phase 02/03.
- [x] Prevent contradictory outcomes: an NPC cannot simultaneously become "best friend" and "attacker" from the same single interaction without a defined sequence.
- [x] Reaction cooldowns prevent perpetual argument loops and event-feed spam.

## 04.3 Households and demographic foundations
- [x] Create households as simple relation/group membership, home assignment and optional partner IDs; ensure referential integrity.
- [x] Eligible adults can pair after repeated positive interactions; no forced instant marriages based on a single chance roll.
- [x] Births only for eligible households after explicit time/cooldown and available housing, subject to town population cap. Newborns consume resources but cannot work.
- [x] Age on game-day progression; define work-age threshold and retirement behavior minimally. Avoid complex genetics or individual family-tree UI.
- [x] Death removes member from current action queue, current partner assignments and household capacity. Keep compact memorial entry only.
- [x] One age-year equals exactly 8,760 hourly ticks; headless boundary fixture verifies 17→18 and 67→68 on the correct final hour, and 180-day headless simulation runs without shortening the calendar.

## 04.4 Social information architecture
- [x] NPC inspector shows top positive/negative relationships, household/home, recent interactions, reasons for current social goal.
- [x] Causal events for encounters, friendship threshold, rivalries/disputes (feuds), household, births and death. Event type keys and Vietnamese display labels are centralized in the app.
- [x] World timeline allows filtering social vs economy/survival; clicking event focuses related living NPC (or a memorial entry if dead).
- [x] Make relationship explanation readable without exposing raw formulas in primary UI; advanced details may be revealed in a tooltip/debug view.

## 04.5 Validation and pacing
- [x] Seed 210: workplace friendship and partner household; seed 211: depleted field feud; seed 306: housing shortage dispute; seed 309: last-bed contention; seed 215: soft population cap.
- [x] Run several 30–180 game-day headless sessions. Assert social events actually occur with sensible frequency and not every tick.
- [x] Event/inspector present exact cause, actor, target and score change; automated Chromium click-through verified. **Qualitative human-device UX testing remains unverified**, not disguised as automated evidence.
- [x] Check population trend, dependent-child food cost, housing and production. Prevent birth-based exponential growth from silently bypassing resources/cap.
- [x] Profile update complexity at 100 NPCs; a social update should not grow proportional to **all possible pairs each hour**.

## Tests / negative cases
- [x] Relation scores clamp; missing/dead IDs cannot be new interaction targets.
- [x] Two citizens apart cannot have a same-place interaction; an intentional remote mechanic must be separately defined.
- [x] Repeated positive/negative interactions modify ties consistently and yield a reasoned event.
- [x] Death mid-household cleans links; no orphaned invalid owner/partner references.
- [x] Birth fails safely when housing full or at population cap; newborn has no job/action.
- [x] Two households attempting same last housing slot resolve deterministically.
- [x] Seed + commands yield identical relation graph/event digests at tick N; save interactions once persistence arrives.
- [x] Playwright: select citizen → see relation target → click related citizen; timeline filter doesn't mutate sim.

## Exit gate

At least **three distinct emergent social stories** are reproducible with seed/test fixtures; relation/household invariants pass; baseline economy still survives. Social interaction rate is human-readable and production tick performance stays healthy.

## Explicit deferrals

No LLM conversations, text-generation costs, detailed romance, genealogical database, fully simulated childhood schooling, legal system, sexual content or arbitrary reputation propagation to the entire world.

## Completed implementation and verification ledger (2026-10-14)

- Implemented on branch: schema v4 sparse directed affinity/trust ties, local deterministic work/commons contact, actual last-unit scarcity witness, capped per-NPC edges and per-tick encounters; mutual pairing with sustained contacts and physical housing; infant age/needs, caregiver-owned food transfer, bounded births, retirement, memorial cleanup.
- UI: relationship/household links, demographic status, social reasons, Social/Economy/Survival filters, clickable actor/target in event feed; React and Phaser remain consumers of canonical state.
- Three reproducible fixtures: seed 210 friendship after repeated shared encounters, seed 211 exhausted-field rivalry with a real depleted node, seed 210 partnership after repeated positive contact and compatible housing. See `src/sim/social.test.ts`.
- Tests added: negative interaction/IDs/distance/death, relationship clamp, household consistency, real dependent food, birth cooldown/house capacity, deterministic 20/50/100 replay. Benchmarks: seed 543 (20 NPC × 180 days), seed 613 (100 NPC × 30 days), stress 119 residents, logged p95 and social counters in GitHub Actions.
- **Verified:** [CI 38520465893](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38520465893) ran clean install, production dependency audit, typecheck, lint, unit/regression/long-running simulation, build and Playwright 5/5 in Chromium (desktop/mobile, canvas reset, event/relationship links). See [PROGRESS](../PROGRESS.md) for measured session data and initial failing test fixes. Benchmark Node CPU cost is not browser FPS. Seed 543: 20 NPC × 180 days, 7 births, 9 pairings, p95 around 1.2ms/tick. Seed 613: 100 NPC × 30 days, 67 shortage-driven disputes, 17 pairings, p95 around 4.6ms/tick. Two-seed 20/50/100 ×30-day replay, 119-person stress, Phase03 ten-seed regression pass.
- Explicit deferral: Phase 05 governance, Phase 06 save/load, global reputation, inheritance and LLM dialogue.
