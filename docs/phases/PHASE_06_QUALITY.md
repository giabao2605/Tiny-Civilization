# PHASE 06 — Save/load, legibility, balancing and performance

**Status:** NOT STARTED · **Requires:** phase 05 feature-complete vertical slice.
**Intent:** Make the simulation reliable and comfortable to *play*, not just technically possible to run.

## Outcome

A player can create a seeded world, inspect it, play days/months, save locally, export backup JSON, refresh browser, restore, and continue **without changing the underlying simulation**. At 100 NPCs, fast-forward remains responsive, events are readable and the game survives extended headless tests.

## 06.1 Safe persistence with no backend
- [ ] Design a compact versioned JSON snapshot: world state, seed, current tick, PRNG internal state, every entity/relationship ID, market balances, policy, pending action timers, counters, bounded event history.
- [ ] Save schema includes `schemaVersion` and explicit game engine content version. Do not rely on local object prototypes or arbitrary class instances.
- [ ] Implement `serialize` and `parse/validate` in pure TypeScript; input size limit and precise human-readable errors.
- [ ] Use browser localStorage for small default saves **only if size tests pass**; prefer a simple IndexedDB wrapper if snapshots actually exceed practical storage limits. Avoid implementing both in elaborate fashion without evidence.
- [ ] Manual Export JSON + Import JSON for backup and moving devices. Import must validate before replacing active world; on failure keep existing game untouched.
- [ ] Offer explicit slots or one autosave + manual backup only if needed by UX; never silently overwrite the only good save with invalid state.
- [ ] Make incompatibility honest: explain when older/newer save versions cannot be read. Add migration only for real schema changes, not hypothetical future v9.
- [ ] Save operation should be atomic from player point of view: use an in-memory coherent world snapshot at a tick boundary.

## 06.2 Deterministic save/replay gate
- [ ] Run 1,000 ticks continuously from a fixed seed + commands; compute canonical state/event digest.
- [ ] Repeat: run 500 ticks → save → validate/load → continue 500 ticks with same commands. Digest must match.
- [ ] Run repeated-seed invariants for populations 20, 50, 100 and after policy/social/market activity.
- [ ] If UI speed controls affect outcome, locate and remove coupling to render timers. World commands must apply at documented tick boundaries.
- [ ] Include long-run seed scenarios over at least 30 game days; test starvation, leader loss, depleted inventory, childbirth and dead references.
- [ ] Handle browser hidden tab/pause without surprise catch-up and without duplicating timed events after resume.

## 06.3 UX and clarity pass
- [ ] Distinct terrain sprites, consistent palette, readable citizens/selection indicator and place markers. Keep sprite pack original or licensed.
- [ ] HUD hierarchy: date, speed, population, food/food runway, wealth, mood, crisis banner; optional detailed graphs only if they teach a rule.
- [ ] Inspector: current objective, why, destination, next state, needs, wallet, job, home, relationships, concise action history.
- [ ] Event feed filtering by survival/economy/social/governance and severity; events remain linked to causes.
- [ ] Clear first-visit onboarding: a few lines explaining observer role and controls; no 20-slide tutorial.
- [ ] Keyboard focus visible for DOM controls; basic contrast, readable type sizes, non-color-only alerts; optional reduced motion.
- [ ] Test desktop at 1366×768 and 1920×1080; narrower browser should still show essential controls without overlapping the map.
- [ ] Avoid unnecessary animation and info storms at 20×: batch trivial event feed entries and preserve significant events.

## 06.4 Profile, tune, document
- [ ] Instrument engine tick p50/p95, event feed growth, pathfinding calls, rendered FPS and memory trend on a named device/browser.
- [ ] Benchmark 100 NPCs on 48×48 with 1×, 5×, 20×; provisional target **p95 < 25 ms/engine tick**, plus no sustained UI freeze. Record actual numbers, frame measurements, hardware and test case.
- [ ] Test 1000+ ticks headlessly and 30 game-day browser smoke; verify invalid actions don't grow unbounded, logs stay capped.
- [ ] Identify real hotspots before optimizing: avoid reroute-per-frame, do not allocate every HUD update, trim historical event detail.
- [ ] Balance across 10+ seeds with healthy/drought/illness conditions; summarize days with stockouts, deaths, average health and housing scarcity.
- [ ] A hard scenario is allowed to collapse if designed so. A typical default scenario should have a credible chance to thrive; adjust configs based on documented evidence, not hidden cheats.
- [ ] Conduct a brief playtest with someone unfamiliar with design; note top 3 confusions and fix at least critical ones.

## Test matrix / failures to simulate

| Area | Required scenario | Expected behavior |
| --- | --- | --- |
| Save | normal reload | identical tick/stock/PRNG/goal state |
| Save | truncated/invalid JSON | error, active world preserved |
| Save | unsupported version | explicit incompatibility, no data loss |
| Save | quota full | notification + export fallback |
| Simulation | continuous vs split 500+500 | same canonical digest |
| Simulation | paused for 1 min | no tick advancement |
| Simulation | browser hidden then shown | no huge unexpected catch-up |
| Runtime | 100 NPC at 20× | measurable responsiveness, no deadlock |
| UI | no NPC selected / dead NPC | graceful empty/memorial inspector |
| UI | rapid event spam | bounded data and readable filtered feed |
| Balance | depleted food+empty treasury | no negative values or ghost trades |

## Exit gate

All high-severity correctness bugs fixed; save/restore deterministic; export/import works; regression suite green; recorded performance and balance evidence; UX fits a novice observer. If a gate is red, log it openly and stay in phase 06.

## Explicit deferral

Cloud save, PWA install support, multi-browser compatibility matrix, full screen reader audit, complex replay scrubber, automated translation and proprietary analytics. Basic accessibility/security still required.
