# PHASE 08 — Optional post-MVP: settlements, trade, diplomacy and conflict

**Status:** DEFERRED (not part of MVP) · **Requires:** playable phase-07 public game + user feedback.
**Purpose:** Preserve ambition without forcing kingdoms/war into the first release. Do not execute simply because this document exists.

## Go/no-go decision before engineering

Proceed only if:
- [ ] MVP is genuinely playable and deployed, has stable saves and seed determinism.
- [ ] At least some players find observing one village interesting over 30–180 days.
- [ ] Measured 100-NPC performance leaves headroom or there's a sound lower-cost multi-settlement approach.
- [ ] Evidence shows trade/conflict would create meaningful new observation loops, not simply a bigger map.
- [ ] Estimated scope/time/balance cost is accepted and no high-severity MVP defect remains.

If any is false, prioritize stronger individual NPC stories, better economic tuning, more legible UI, varied seeds or extra scenarios **within the existing world**.

## Potential roadmap (do not build all at once)

### 08A — Second settlement, separate but compatible simulation
- [ ] Choose a modest world representation: two small connected villages or a lightweight world map with a separate local view. Avoid simulating unseen massive worlds at full graphical fidelity.
- [ ] Existing world state becomes a container for one or more settlements **only after a migration design preserves saves**.
- [ ] Allow resources, leaders, population and history per settlement, without duplicating the entire engine code.
- [ ] Implement travel/trade route as time-and-capacity-bounded shipments. Test no duplication/loss of cargo or money during travel.
- [ ] Show player why a trade improved or worsened a town; stress test stranded cargo and a town going extinct.

### 08B — Inter-town relationships and policy
- [ ] Add minimal diplomatic values grounded in trade, past conflict and scarcity.
- [ ] One policy each for cooperation/restrictions with finite costs and clear triggers. Avoid enormous treaty/ideology systems.
- [ ] Create visible history events: trade established, failed caravan, dispute, alliance.
- [ ] Deterministic long-run tests and one-tile obstruction/unreachable route cases.

### 08C — Limited conflict, if gameplay warrants
- [ ] Start from a **bounded raid/territorial dispute model**, not tactical armies: actor groups, target, costs, combat resolution, losses, retreat/cooldown, health/resource effects.
- [ ] Use explicit war triggers (resources, grievance, leader stance) and diplomatic offramps; violence must have stakes and consequences.
- [ ] Keep civilians/economy consistent, casualties remove actual entities, buildings/resources do not magically regenerate.
- [ ] Test simultaneous raids, no available fighters, emptied stocks, dead leaders and settlement extinction.
- [ ] Narrative timeline references actual actions and conditions, with no made-up fabricated battlefield scenes.

## Hard constraints

- Never break old save files silently; support a validated explicit migration or clearly label incompatible world-version release.
- Do not jump from 100 to thousands of high-frequency individual agents without measured scaling plan.
- Don't add an external AI API, PvP, always-on server or cloud database by default.
- Don't promise an "infinite history simulator"; quality of understandable outcomes beats system breadth.
- Preserve current deterministic step model. Any model changes need focused ADR in master plan and regression fixtures.

## Gate for each subphase

A second settlement only counts when actual trade conserves goods and both economies still run; diplomacy only when relationships change decisions; conflict only when actual resources, health, morale or political outcomes change. Each subphase should have independent seed fixtures, screenshots, browser smoke and a go/no-go review before the next.
