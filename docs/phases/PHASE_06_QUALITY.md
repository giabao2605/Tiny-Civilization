# PHASE 06 — Save/load, legibility, balancing and performance

**Tóm tắt tiếng Việt:** Kiểm tra và nâng chất lượng: save/load đúng kết quả mô phỏng, test nhiều seed, cân bằng, đo hiệu năng và làm UI dễ theo dõi.

**Status:** IN PROGRESS on `feat/phase-06-quality` (2026-10-15); **not merged and not DONE** · **Requires:** Phase 05 DONE / merged as `4c03cd85`.
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


## Phase 06 verification ledger (in progress)

- Versioned `sim-v5-phase06` serialization/validation, browser localStorage, JSON import/export, frozen-tick coordinator restore, pending governance command/ID restoration: implemented in branch; regression and Chromium tests exist.
- Headless six-case 20/50/100 NPC × two-seed, 1,000-tick continuous vs 500+save/load+500 replay: tests passed on preliminary CI, but must rerun at final head.
- Preliminary GitHub Ubuntu Node measured p95 at 1,000 ticks: 20 NPC 1.582 ms, 50 NPC 3.243 ms, 100 NPC 5.191 ms. Snapshot JSON 110,834 / 282,573 / 443,278 bytes respectively. Node benchmark is not browser FPS.
- 10-seed 30-day baseline passed preliminary tests. Low-initial-reserve scenario recovered quickly, so an adversarial no-regeneration famine scenario was added; final measurements still required.
- Chromium suite initially exposed a test-specific wall-clock threshold failure after resuming from hidden tab. The app's hidden-tab discard check succeeded, and the assertion now verifies no immediate catch-up instead of assuming Playwright runs exactly 100 ms later.
- **Validated after code fix:** [feature CI #38671225735 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38671225735) ran 84/84 Vitest and 11/11 Playwright Chromium after TypeScript/lint/audit/build. Artifact [#11943838565](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38671225735/artifacts/11943838565) preserves desktop/mobile screenshots.
- **Browser measurement (Ubuntu GitHub Actions Chromium, not physical device):** 100 NPC, 20×, 45 frame sample, **25 mean FPS**, **83.3 ms p95 frame**, **81.4 MB usedJSHeapSize**. Responsive enough to complete browser E2E but janky; not a 60 FPS claim. JS heap is a sample, not leak-free proof.
- **Severe famine verified:** 10 seeds × 720 ticks, all 10 retained no food stock for all 30 daily samples, all 100 initial NPCs died by day 30; finite goods/money invariants and dead-action cleanup passed. Default and low-reserve samples remained 100 alive in each seed, with real farming replenishment.
- **Remaining quality gates:** real novice playtest **not performed**, physical phone/browser performance **not measured**; PR commit and CI still need final confirmation. Phase remains **PARTIAL / IN PROGRESS** until all material exit gates are satisfied.
