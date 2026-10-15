# PHASE 05 — Governance, shocks and visible collective consequences

**Tóm tắt tiếng Việt:** Có trưởng làng, chính sách giới hạn và hai loại biến cố tác động thật tới kinh tế/sức khỏe. Chưa làm chiến tranh.

**Status:** DONE on feature branch, verified by [CI #38533542563](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563); [PR #6](https://github.com/giabao2605/Tiny-Civilization/pull/6) is not merged · **Requires:** social/economic stability through phase 04.
**Intent:** Town decisions and small disasters create real history without implementing nations, diplomacy or battles.

## Player story

After an observable leadership cycle, the village chooses a leader based on a handful of explicit public factors. A bad harvest reduces food production for a fixed duration, the food runway shrinks, residents struggle, and rationing may be introduced. The policy conserves a finite reserve but imposes tradeoffs. The timeline attributes the recovery, damage and costs to the underlying calculations rather than random text.

## 05.1 Town governance (small, finite)
- [x] Town has one leader ID, election/selection schedule and at most two visible policy toggles at launch.
- [x] Candidate eligibility is based on living adulthood, plausible membership and simple measurable support/reputation; stable seed used only for tie-breaking.
- [x] Elections/leadership changes are periodic or trigger on vacancy; no leader after death without a recovery mechanism.
- [x] Leader acts through **same world tick/action-effects rules**, not a hidden secondary timer.
- [x] Treasury and village stocks are finite. Public policy costs/sinks visible in stock/treasury history.
- [x] Start with one meaningful policy: **food rationing / emergency reserve release**, choose the simpler of these after a phase-05 micro-prototype. Document trigger, eligible recipients, food budget, duration and side effects.
- [x] Player may optionally choose/activate a small public policy through one UI command; if the simulation chooses automatically, make rationale visible and allow observe-only mode.
- [x] Reject policy commands with unavailable resources, illegal state, unknown IDs or duplicate same-tick activation.

## 05.2 Two shocks (not a random disaster kitchen sink)
- [x] **Poor harvest:** bounded reduction in food output at affected farms for a known period; records area, start/end, production penalty, possible recovery.
- [x] **Local illness:** bounded affected residents, temporary health/work productivity impact, gradual recovery; avoid complex airborne epidemiology unless observation requires it.
- [x] Both shocks have cooldowns, max concurrency, finite affected entities and counteracting recovery paths. Starting seed makes event timing reproducible.
- [x] Shock severity has measured consequences and must not always annihilate the village in balanced seeds.
- [x] No shock materializes food/money out of nowhere; aid consumes available stock/treasury.
- [x] Cause tags include shock type, location, impacted production/health and policy response; no ungrounded "mysterious plague" popups.

## 05.3 Society reacts, not just a global HUD warning
- [x] Hungry citizens change goals; poor health reduces work output; shortages affect trade/jobs.
- [x] Relationships may influence social assistance only if an explicit, tested resource transfer exists. Do not grant goods by adding a friendship score.
- [x] Leadership popularity / collective satisfaction moves in the expected direction when tangible outcomes worsen or improve; avoid circular happiness calculations.
- [x] Citizens affected by policy display their actual ration/price/need change in inspector.
- [x] Crisis event log provides a compact chronology: onset → measured impact → response → outcome, including failures.
- [x] Emergency intervention is limited and transparent; still possible for settlement to fail in an extreme seed.

## 05.4 Simulation fixtures and UI scenarios
- [x] Fixture A: normal town, leader cycle occurs; no duplicate leader or invalid candidate.
- [x] Fixture B: poor harvest with sufficient reserve; rationing changes consumption/runway and recovery.
- [x] Fixture C: poor harvest with zero reserve; policy fails cleanly, food remains nonnegative, hardship reported.
- [x] Fixture D: illness affects selected workers; production drops and recovers based on actual affected agents.
- [x] Fixture E: leader dies during crisis; vacancy resolved; no dead leader executes actions.
- [x] E2E: select event, locate cause in town charts, inspect affected citizen, try policy with and without sufficient reserve.

## Automated test checklist

- [x] Same seed + intervention commands produces same leader/shock results at tick N.
- [x] Policy cannot spend same reserve twice, cannot act retroactively, never makes negative stock.
- [x] Shock lasts only configured duration and does not cause unbounded cascade of event creation.
- [x] Villager illness recovery / death consistent with health rules and work eligibility.
- [x] Election chooses one living eligible leader; empty pool handled with explicit vacancy fallback.
- [x] Crisis does not bypass action preconditions/path constraints or money conservation.
- [x] Normal seeded 30-day economy regression suite remains green; intentionally hard scenarios can fail **as game outcomes** without engine invariant failures.
- [x] Player-visible event reports do not falsely attribute recovery to a policy that was never active.

## Exit / no-go

One full crisis chronology with measurable cause and consequence, one defensible leadership change, one bounded policy, two shock types, passing simulation and browser checks. If crises merely show warning text and don't affect production/people, **phase incomplete**.

## Defer

National politics, factions with deep ideology, procedural war, elaborate public spending budgets, complex medicine, multi-village elections and diplomacy. These belong after v1, if at all.

## Implementation notes / decisions (PR #6)

- Base `main`: `b25007a7f19921b9431a98253abdf994eddd0885`; independent branch `feat/phase-05-governance`.
- Micro-prototype decision: choose **emergency food release** instead of ration restrictions. A ration system would need retuning household child-feeding, buyer purchase frequency and fairness, while a validated transfer of up to 6 real food units reuses the existing market-to-person ownership model and makes the trade-off measurable immediately.
- Elections happen every 720 ticks or upon death/vacancy. A candidate's score combines available directed social edges from living adult voters, health, food, wallet and job. Higher score wins; ties break on ascending ID. Empty pool stays vacant and retries daily. Public reputation follows actual health/starvation once per day.
- First poor harvest starts at tick 96, lasts 144 hours, repeats no sooner than 720 hours and respects cooldown. Seed determines 25%/50% lost potential for up to three valid fields. First local illness starts tick 168, lasts 96 hours, repeats no sooner than 840 hours, and affects at most six live workers. Severity changes missed work hours and daily HP loss. Both can overlap but there are at most two active shocks.
- `emergency-food` accepts only a valid leader and a command stamped for the current hour, only during shocks or extreme starvation, with positive market food stock, living needy recipients, one action per interval and 72-hour cooldown. Transfer is 1 real item per recipient to at most six, sorted by hunger and ID. No money is transferred; it is market inventory donated in-kind, with explicit opportunity cost and before/after numbers. Active policy display lasts 24 hours. Eligible leader may propose it automatically once on a daily boundary when a shock co-occurs with severe shortages.
- Bounded causal events include stable IDs and before/after data when applicable. Schema bumped v4 → v5; no speculative save/load implementation.
- Adversarial fixtures and multi-seed performance log are in `src/sim/governance.test.ts`, screenshot test in `tests/e2e/smoke.spec.ts`. **Exit gate verified at commit `3c68cea0`; CI includes 74 unit/simulation cases and 8 Chromium E2E checks.**

## Final acceptance record (2026-10-14)

- [CI run #38533542563](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563) on commit `3c68cea0`: clean checkout, `npm ci`, production-dependency security audit, TypeScript, ESLint, **74/74 Vitest**, production build and **8/8 Chromium E2E**, all passed.
- [Browser evidence artifact](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563/artifacts/11879336547): desktop Governance, timeline cause inspector and mobile screens for successful food relief / empty market reserve.
- Two real bounded crises, finite market-sourced policy, election/succession, citizen/household effects, deterministic replay and conservation are covered by `src/sim/governance.test.ts`. Existing 30-day economy fixtures and 180-day social benchmark remain green.
- Explicit design resolution: leader-score ties use **ascending numeric NPC ID**, not a PRNG draw. This fulfills deterministic arbitration while keeping the seed responsible for starting NPC traits and crisis severity; no hidden election dice rolls. Relief for dependent children goes into their adult guardian's bag, and a caregiver prioritizes actual home feeding before market resale.
- Explicit browser zero-reserve fixture `?fixture=governance-empty-reserve` only exists in Vite development, never the production build. The test checks rejected activation, 0 new food and unchanged currency.
- **Deferred:** actual save/load remains Phase 06, as do browser profiling on physical devices, stress/fuzz beyond executed seeds, multi-village governance and deep public budgets. Passing Chromium E2E is not a claim of stable physical-device FPS. Phase 05 is complete **on the PR branch**, not merged into `main`.
