# PHASE 05 — Governance, shocks and visible collective consequences

**Status:** NOT STARTED · **Requires:** social/economic stability through phase 04.
**Intent:** Town decisions and small disasters create real history without implementing nations, diplomacy or battles.

## Player story

After an observable leadership cycle, the village chooses a leader based on a handful of explicit public factors. A bad harvest reduces food production for a fixed duration, the food runway shrinks, residents struggle, and rationing may be introduced. The policy conserves a finite reserve but imposes tradeoffs. The timeline attributes the recovery, damage and costs to the underlying calculations rather than random text.

## 05.1 Town governance (small, finite)
- [ ] Town has one leader ID, election/selection schedule and at most two visible policy toggles at launch.
- [ ] Candidate eligibility is based on living adulthood, plausible membership and simple measurable support/reputation; stable seed used only for tie-breaking.
- [ ] Elections/leadership changes are periodic or trigger on vacancy; no leader after death without a recovery mechanism.
- [ ] Leader acts through **same world tick/action-effects rules**, not a hidden secondary timer.
- [ ] Treasury and village stocks are finite. Public policy costs/sinks visible in stock/treasury history.
- [ ] Start with one meaningful policy: **food rationing / emergency reserve release**, choose the simpler of these after a phase-05 micro-prototype. Document trigger, eligible recipients, food budget, duration and side effects.
- [ ] Player may optionally choose/activate a small public policy through one UI command; if the simulation chooses automatically, make rationale visible and allow observe-only mode.
- [ ] Reject policy commands with unavailable resources, illegal state, unknown IDs or duplicate same-tick activation.

## 05.2 Two shocks (not a random disaster kitchen sink)
- [ ] **Poor harvest:** bounded reduction in food output at affected farms for a known period; records area, start/end, production penalty, possible recovery.
- [ ] **Local illness:** bounded affected residents, temporary health/work productivity impact, gradual recovery; avoid complex airborne epidemiology unless observation requires it.
- [ ] Both shocks have cooldowns, max concurrency, finite affected entities and counteracting recovery paths. Starting seed makes event timing reproducible.
- [ ] Shock severity has measured consequences and must not always annihilate the village in balanced seeds.
- [ ] No shock materializes food/money out of nowhere; aid consumes available stock/treasury.
- [ ] Cause tags include shock type, location, impacted production/health and policy response; no ungrounded "mysterious plague" popups.

## 05.3 Society reacts, not just a global HUD warning
- [ ] Hungry citizens change goals; poor health reduces work output; shortages affect trade/jobs.
- [ ] Relationships may influence social assistance only if an explicit, tested resource transfer exists. Do not grant goods by adding a friendship score.
- [ ] Leadership popularity / collective satisfaction moves in the expected direction when tangible outcomes worsen or improve; avoid circular happiness calculations.
- [ ] Citizens affected by policy display their actual ration/price/need change in inspector.
- [ ] Crisis event log provides a compact chronology: onset → measured impact → response → outcome, including failures.
- [ ] Emergency intervention is limited and transparent; still possible for settlement to fail in an extreme seed.

## 05.4 Simulation fixtures and UI scenarios
- [ ] Fixture A: normal town, leader cycle occurs; no duplicate leader or invalid candidate.
- [ ] Fixture B: poor harvest with sufficient reserve; rationing changes consumption/runway and recovery.
- [ ] Fixture C: poor harvest with zero reserve; policy fails cleanly, food remains nonnegative, hardship reported.
- [ ] Fixture D: illness affects selected workers; production drops and recovers based on actual affected agents.
- [ ] Fixture E: leader dies during crisis; vacancy resolved; no dead leader executes actions.
- [ ] E2E: select event, locate cause in town charts, inspect affected citizen, try policy with and without sufficient reserve.

## Automated test checklist

- [ ] Same seed + intervention commands produces same leader/shock results at tick N.
- [ ] Policy cannot spend same reserve twice, cannot act retroactively, never makes negative stock.
- [ ] Shock lasts only configured duration and does not cause unbounded cascade of event creation.
- [ ] Villager illness recovery / death consistent with health rules and work eligibility.
- [ ] Election chooses one living eligible leader; empty pool handled with explicit vacancy fallback.
- [ ] Crisis does not bypass action preconditions/path constraints or money conservation.
- [ ] Normal seeded 30-day economy regression suite remains green; intentionally hard scenarios can fail **as game outcomes** without engine invariant failures.
- [ ] Player-visible event reports do not falsely attribute recovery to a policy that was never active.

## Exit / no-go

One full crisis chronology with measurable cause and consequence, one defensible leadership change, one bounded policy, two shock types, passing simulation and browser checks. If crises merely show warning text and don't affect production/people, **phase incomplete**.

## Defer

National politics, factions with deep ideology, procedural war, elaborate public spending budgets, complex medicine, multi-village elections and diplomacy. These belong after v1, if at all.
