# Tiny Civilization — Progress / handoff log

**Updated:** 2026-10-15  
**Current stage:** Phase 00–05 DONE and merged to `main`. Phase 05 [PR #6](https://github.com/giabao2605/Tiny-Civilization/pull/6) merged at `4c03cd8596eb75d436b6df8159c1b9ccca7d65e6`, [post-merge CI #38662711100 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38662711100). Phase 06 is in progress on `feat/phase-06-quality`, NOT merged. Phase 07 release has not started.
**Authoritative roadmap:** [MASTER_PLAN](MASTER_PLAN.md)  
**Rules/contract:** [SIMULATION_CONTRACT](SIMULATION_CONTRACT.md)

| Phase | Status | Gate |
| --- | --- | --- |
| 00 Foundation | DONE, merged to main | npm ci, typecheck, lint, Vitest, build, Playwright Chromium PASS |
| 01 Living world | DONE, merged to main (PR #2) | 48×48 map, 20 purposeful agents, inspector, controls; CI PASS |
| 02 Survival | DONE, merged (PR #3) | Finite food/wood, needs, production, shortage/death and verified 10-seed balance |
| 03 Economy | DONE, merged to `main` (PR #4) | All 20/50/100 ten-seed 30-day runs and GitHub Actions PASS |
| 04 Social | DONE, merged to `main` (PR #5) | Directed relationships, causal stories, households/birth/death, 30–180 game-day tests, 5 Chromium E2E, last branch CI PASS |
| 05 Governance | DONE, merged to `main` (PR #6) | Finite food aid, elected leader, poor harvest and illness, 74 unit/8 Chromium E2E; post-merge CI PASS |
| 06 Quality | IN PROGRESS (unmerged) | Versioned save/load, replay, Chromium error tests, 10-seed stress, Node and browser profile; final gate pending |
| 07 MVP release | NOT STARTED | CI green, deployed playable build |
| 08 Expansion | DEFERRED | Only after MVP validation and new go/no-go |

## Phase 06 — Quality & Safe Persistence (2026-10-15; verification in progress)

- Branch: `feat/phase-06-quality` starts exactly from Phase 05 merge `4c03cd8596eb75d436b6df8159c1b9ccca7d65e6`; main CI run `38662711100` succeeded. **No merge to main**.
- Implemented on branch: `src/persistence/save.ts` versioned `sim-v5-phase06` format, 8 MiB import cap, structural/domain validation for entities, positions, ownership, currency, households, relationships, governance, shocks, timers, trade history and events. Coordinator preserves pending policy commands/request IDs; world is swapped only after successful parse/validation, and loading pauses without any synthetic tick or RNG draw.
- UI: localStorage save/load, downloadable JSON and file import, errors for corruption, schema/version mismatch and full/quota-denied storage. Save is synchronous between browser event-loop ticks; storage-write failure never mutates the live world. Observer onboarding, legible HUD summary, NPC route reason, keyboard focus and mobile save controls.
- Replay regression: `src/persistence/save.test.ts` runs 1000 continuous ticks versus 500 + JSON save/load + queued policy + 500 ticks at populations 20/50/100, seeds 210/613, compares the **entire world**, RNG, governance and currency. Forged IDs, negative cash, invalid terrain, truncated JSON, unsupported engine and oversized file are rejected.
- Measured Node 22 / GitHub Ubuntu sample from [Actions #38670368237](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38670368237) (run fails *only* at a time-sensitive browser hidden-tab assertion, not at the Node benchmark): 1000 ticks seed 543 => 20 NPC p50 **0.212** ms, p95 **1.582** ms, save **110,834** bytes; 50 NPC p50 **0.637** ms, p95 **3.243** ms, save **282,573** bytes; 100 NPC p50 **0.889** ms, p95 **5.191** ms, save **443,278** bytes. These samples meet provisional p95 <25 ms in Node only, **not** proof of physical-device FPS.
- First 10 seeds 100 NPC × 720 ticks normal: all 100 alive and 0 stockout days at daily sampling; p95 across seeds 2.626–4.852 ms. Simply emptying the initial market stock recovered rapidly because farming replenished supply, revealing that this was **not an adequately severe crisis**. Added a separately named famine scenario with initial food and active farm stock/regeneration reduced to zero; results **pending final run**. This is adversarial test setup, not a balance patch or infinite supply shortcut.
- Browser tests include save-refresh-load, JSON roundtrip, broken and incompatible imports, quota failure, 390px viewport and hidden-tab discard; 100 NPC × 20× with inspector/timeline/save and sampled Chromium frame times was added subsequently. Initial hidden-tab assertion had an invalid fixed 100 ms wall-clock assumption and was corrected to check the actual **absence of synchronous catch-up**, without relaxing the underlying hidden-tab zero-tick test.
- Updated measurements from [CI #38670799035](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38670799035) (all TypeScript/lint/Vitest/build passed; browser 10/11, remaining test incorrectly expected a shock-start event to stay inside a bounded 120-item feed after prolonged 20×): 20 NPC p50/p95 **0.403/2.583** ms; 50 NPC **1.038/5.098** ms; 100 NPC **1.429/8.841** ms across 1,000 ticks. Save sizes unchanged: **110,834 / 282,573 / 443,278 bytes**. CI host load affects timing; p95 still under provisional Node-only 25 ms threshold.
- 10 seeds × 30 days × 100 NPC per scenario: **normal** survived 100/100, deaths 0, market stockout days 0, homeless 0, avg health 100. **Low initial reserve** also survived 100/100, showing farm regeneration replenished stocks quickly. **Persistent famine adversarial fixture** removed both initial food and field stock+regeneration: 10/10 seeds had 30/30 daily food-stockout samples, all 100 original residents died by day 30, 0 money/resource conservation failures, 0 aid transfers from empty market. This extreme case tests valid collapse and death cleanup; it is not an intended default balance setting.
- 100 NPC at 20×: Phase 06 new browser test originally expected the word "Biến cố" after tick >110, but the intentionally bounded 120-event history has already evicted shock onset from tick 96. Corrected the test to check filter accessibility while existing Phase05 Chromium tests still check freshly emitted causal events, rather than removing or enlarging event caps.
- **Pending:** final green CI at PR head, screenshots and Chromium numeric frame report, human novice playtest and physical-device FPS. No human playtest was performed; no FPS was invented. The absence of those must not be mislabeled DONE.

## Phase 04 Social implementation (2026-10-14)

**Status: DONE, merged to `main` as `1a5933b74b04c32fc371f0fc3163bfed9fd5535b`.** Source branch `feat/phase-04-social` was created from Phase 03 main `73ae8f57`; [PR #5](https://github.com/giabao2605/Tiny-Civilization/pull/5) is closed/merged. Final feature SHA `f8f01ef` has [CI 38521166064](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38521166064) PASS. Next work belongs on a new Phase 05 branch from the latest `main`.

**Code added on branch:** `world.ts` schema v4 with directed sparse ties, separate home-backed household IDs, monotonic births, bounded memorials; `social.ts` validating same-tile encounter, work cooperation / actual last-unit scarcity, bounded relationship graph/events, deterministic tie and partner selection, dependant food spending, age / birth/death constraints. Integrated into `engine.ts` on the existing hourly clock, with housing assignment in `economy.ts`. React inspector now navigates relationship and household members, shows demographics / memorials and filters Social/Economy/Survival events.

**Causal fixtures/tests:** `social.test.ts` documents seeded friendship (210), exhausted-field rivalry (211), valid pairing (210), age-dependent food consumption and death cleanup; `social.benchmark.test.ts` measures 20 NPC × 180 days (seed 543), 100 NPC × 30 days (seed 613), and a 119-resident stress fixture. Additional 20/50/100 × two seeds × 30-day deterministic checks. Chromium social inspector, timeline, 20× and mobile screenshots are automated in `tests/e2e/smoke.spec.ts`. Results are pending, not assumed.

**Verified quality gate (GitHub Actions):** [run 38520425782](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38520425782) PASS clean `npm ci`, production `npm audit --omit=dev --audit-level=high`, `npm run typecheck`, `npm run lint`, full Vitest including all Phase 00–03 regressions, `npm run build`, Chromium installation and **5/5 Playwright E2E** desktop/mobile. Includes the social event actor link, relation link, timeline filters, pause/20×, repeated canvas mount and no console/asset errors. Initial [run 38519190518](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38519190518) failed new test readonly tile.x; [run 38519443307](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38519443307) failed two birth tests because a fixture advanced less than 30 days since partnership, fixed. No old tests were deleted to silence failure.

**Measured headless sessions (CI run 38520425782, Node 22 / Ubuntu, CPU runner-dependent):**
- Seed **543**, **20 NPC × 4,320 ticks / 180 days**: 27 alive, 0 dead, **11 households**, 7 dependent children, 9 partnerships, 7 births, **4,646** encounters, 272 directed edges, money **2,440** invariant, mean **0.366 ms/tick**, p95 **1.180 ms/tick**. Event graph demonstrated natural friendships and pairing while initial housing had spare capacity.
- Seed **613**, **100 NPC × 720 ticks / 30 days**: 100 alive, 0 dead, **83 households**, 17 partnerships, **1,731** encounters, **67** housing scarcity disputes, 1,335 directed edges, 0 births due to soft cap, money **12,200** invariant, mean **1.264 ms/tick**, p95 **4.562 ms/tick**. Housing expands to 100 places through wood-backed construction. Results are not browser FPS measurements.
- Seeded replay **20/50/100 × 2 seeds × 720 ticks**, 119-person hard-cap stress, social limit and food/wood/cash conservation all PASS. Existing Phase 03 ten-seed 720-tick scenarios for 20/50/100 continue PASS and money/trade/housing retain their measured invariants.
- Three explicit causal stories: seed 210 work-site repeated encounters → friendship; seed 211 actual depleted field → dispute/rivalry; seed 210 repeated positive contact over 72 hours → legal partnership/household. Further seeded case 306 verifies two homeless NPCs dispute a real housing shortage; seed 309 verifies last housing slot contention resolves deterministically by actor order.
- Screenshots saved by Playwright into GitHub Actions `test-results/` artifacts; screenshots are browser evidence, not validation on the user's physical phone. No claim of an empirical 60 FPS guarantee.

**CI debugging evidence:** The initial readonly fixture and too-short birth timeline errors were fixed and subsequent full regression + browser runs PASS. Production-only audit PASS; full dev dependency advisory status and manual mobile/FPS remain release concerns. Local authoring host cannot access npm/GitHub by DNS; execution evidence comes from GitHub Actions, not imaginary local runs.

**Limits:** Births remain deliberately capped and do not guarantee healthy childhood during food shortages. No detailed lineage, inheritance, AI conversation, government, save/load or release. Relationship history is sparse, events are capped; dead people's goods remain held to preserve accounting. Phaser remains a read-only renderer.

## Phase 03 Economy, housing and 100 NPCs (2026-10-14)

**Status: DONE, merged to `main` as `83ef46c48068e782b5bdd4a234f67d60d958808c`.** Source branch was created from Phase 02 main `0c8db616`; closed merged [PR #4](https://github.com/giabao2605/Tiny-Civilization/pull/4). Phase 04 begins only in a separate task/branch.

**Implemented and CI-verified source:**
- src/sim/world.ts: 20/50/100 deterministic worlds; unique IDs; bounded site capacities, nullable homelessness, citizens' wallets and owned goods, one market/treasury, construction records, expanded finite field/forest production nodes.
- src/sim/economy.ts: atomic buy/sell with enough funds, owned stock, location, storage capacity and live citizen checks; wood reservation at construction start, paid hourly builders and house completion.
- src/sim/engine.ts: stable ascending NPC effects; physical harvested goods enter NPC bags, travel and one-hour market trades, paid meal purchases, self-owned meals, finite builders and survival priority; events read from committed simulation.
- src/sim/balance.ts: integer prices, fixed initial cash, population-scaled map resources, node slot caps, house costs/durations and cooldowns.
- src/app/App.tsx, livingCoordinator.ts and WorldScene.ts: population choice, responsive inspectors/dashboard, wallets, trade history, builder progress, market marker and dynamically completed houses; no React/Phaser economy mutations.
- economy.test.ts, benchmark.test.ts, updated survival and browser smoke suites: conservation and failed trade tests, parallel buyers/builders, no free-food escape, 720-tick 100-NPC scenarios and Chromium 100-NPC coverage.

**Ownership:** WorldState.inventory is the sole market warehouse, distinct from each NPC's owned bag. Initial finite money supply is 122 coins per NPC: 32 wallet plus 90 market coins per resident (20/50/100 supply 2,440/6,100/12,200). Current integer prices: market buys food 2, sells 3; buys wood 1, sells 2. A spread remains in the finite market treasury and no wage/harvest mints coins. Construction consumes 8 market wood on start; builder must complete 8 funded hours paid 4 treasury coins/hour. New homes give 4 real beds.

**Verification history:** Early failures were identified and fixed (TypeScript nulls/narrowing, one ambiguous E2E selector, warehouse-last-slot deadlock). Post-circulation implementation CI [38513743348](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513743348) and latest source-plus-regression CI [38514384101](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38514384101) both PASS: clean npm ci, production dependency audit, typecheck, lint, 47 Vitest cases, production build, and 4 Playwright Chromium E2E tests. E2E stores [phase-03 browser screenshots](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38514384101/artifacts/11871206561). GH-hosted Ubuntu Actions was the execution environment; local authoring container cannot reach npm registry.

**Final 30-day baseline:** 10 seeds for EACH population (20, 50, 100), 720 ticks/seed: all 20/20, 50/50 and 100/100 alive with no invalid actions at the end of the sampled runs. Exact money conservation: 2,440 / 6,100 / 12,200. Market cash at tick 720: 20 NPC 1,096–1,120; 50 NPC 3,861–3,888; 100 NPC 8,295–8,311, all strictly finite and positive. Both market purchases and sales were nonzero in every seed: 100 NPC seeds market bought 913–929 food/wood units from citizens and sold 359–375 back to citizens; this shows a real circular trading path rather than fake HUD balances. At 100 NPC, five wood-backed houses expanded capacity from 80 to 100 and all residents had housing. Source: [CI run 38513743348](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513743348). Measured Node-only benchmark (GitHub Ubuntu Node v22.23.3): 100 NPC, 720 ticks, average 1.880 ms/tick, p95 8.691 ms/tick, 36,297 BFS calls (50.41 per tick), GC-sensitive heap delta 3,636,288 bytes. Heap sampling is not proof of a browser memory leak or of a leak-free app.

**Bugs exposed and fixed:**
1. Strict TS nullability and narrowed-literal errors from schema v3, fixed before CI.
2. Playwright ambiguous “Tạo lại” selector, fixed with exact match.
3. 50 NPC formerly died with market wood storage at 179/180: seller attempted to deposit 2 units in the last 1-unit slot, was rejected repeatedly, blocked farming and exhausted wallet. Engine now chooses a legal quantity based on free space and finite cash; a permanent regression test guards this case.
4. Worker frequently changed work nodes and lost progress; stable node preference avoids oscillation while keeping capacity limits.
5. Long-run monetary audit found little consumer purchasing because farmers ate owned harvest. Adjusted to allow safe sale of a full harvest then purchase of a meal, preserving the emergency ability to eat personally owned food. Lower wholesale prices food 2/retail 3 and wood 1/retail 2 retain market liquidity; the spread is retained in the finite market treasury. New directional cumulative commodity counters make genuine market circulation auditable. This adjustment passed the final 10-seed/population and E2E suites in CI 38513743348 and 38514384101.

**Independent review:** Phase 02 resource-contention, depleted forest rerouting, blocked workplace fallback, health rest and critical recovery regressions were restored with Phase 03 ownership semantics; the final source SHA passed 47 Vitest cases. Verified stable ID-order settlement, no magic wages, finite endowments, atomic last-unit trades, personal vs market inventory conservation, one-time material reservation, paid builder work, deceased citizens blocked from trading/building, legal construction tiles, housing capacity, bounded history, single WorldState and no simulated action from React/Phaser. No Phase 04 features added.

**Residual limitations:** Browser passed 20×/inspector E2E but numerical FPS and real-device compatibility were not benchmarked; Chromium screenshots exist in CI artifacts but were not manually visual-certified here. Heap delta is GC-sensitive, not a trustworthy leak proof. Future Phase 06 owns full persistence/save migration. No autonomous demand for purchased wood once housing construction finishes, but atomic wood purchase is supported and unit-tested. Long-term equilibrium beyond the validated 30-day horizon, additional jobs/consumers and housing maintenance are deferred unless new evidence justifies them. No hidden food/money faucets, bank, AI agents, backend, social or 3D. **PR #4 is merged; Phase 04 has not begun.**

---

## Phase 02 Survival implementation and verification (2026-10-14)

**Branch:** `feat/phase-02-survival` from main `d6420cc07c59d1a4bb70a38fa353e5eec3cafd47`. **PR:** [#3](https://github.com/giabao2605/Tiny-Civilization/pull/3), historically left open during Phase 02 work, since merged into main at `0c8db616`. Scope was limited to Phase 02.

**Shipped:** `src/sim/balance.ts` centralizes hourly rates and finite capacities; `world.ts` adds differentiated hunger/energy/health, explicit jobs, finite field/forest nodes, town inventory and cumulative/day statistics; `engine.ts` enforces a stable hourly pipeline with sorted ID-based atomic transfers, food consumption, starvation/health/death, fatigue, cooldown and source selection. Per-hour action exclusivity prevents work while moving or sleeping. Fields/forest regenerate only at day boundaries up to capacity, stock is nonnegative, and dead agents stay inert. There are no wages, money, markets, full persistence or Phase 03 mechanisms.

**UI:** React shows actual food/wood stocks, daily food produced/consumed, runway if previous-day consumption is known, hungry/endangered counts, needs bars, jobs, action durations and recent decisions. Phaser paints production-site stock/depletion markers, hides dead citizens and retains pan/zoom/selection. Events distinguish production, meals, missing food, depletion, recovery, danger and death.

**10-seed × 30-day baseline (720 ticks per seed):**

| Seed | Living | Food | Wood | Food produced | Food consumed | Deaths |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 20 | 130 | 120 | 698 | 598 | 0 |
| 2 | 20 | 132 | 120 | 698 | 596 | 0 |
| 3 | 20 | 131 | 120 | 699 | 598 | 0 |
| 4 | 20 | 131 | 120 | 698 | 597 | 0 |
| 5 | 20 | 132 | 120 | 699 | 597 | 0 |
| 6 | 20 | 130 | 120 | 697 | 597 | 0 |
| 7 | 20 | 132 | 120 | 698 | 596 | 0 |
| 8 | 20 | 127 | 120 | 693 | 596 | 0 |
| 9 | 20 | 130 | 120 | 698 | 598 | 0 |
| 10 | 20 | 131 | 120 | 698 | 597 | 0 |

All reported stocks satisfy conservation: `food = 30 initial + produced - consumed`, `wood = 6 initial + produced`. Both are additionally bounded by warehouse capacity (food 150, wood 120), while source stock is finite and renewed only within node caps. **Wood reaches its storage cap and stays unused until a later phase introduces a legitimate wood sink; this is intentional, not infinite extraction.**

**Verified CI:** [PR check run 38508978334](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38508978334) completed successfully with clean `npm ci`, production audit, `typecheck`, `lint`, 32 Vitest tests, production build and **3 Playwright Chromium tests** (desktop/mobile, pause/20×/selection/survival HUD). [Browser screenshot artifact 11868949006](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38508978334/artifacts/11868949006). Additional adversarial tests after this run cover forest rerouting, health recovery, failed meals and an individual farmer's produce→eat causal chain; check the most recent PR CI before merging.

**Shortage/depletion:** source regeneration disabled + food set to zero leads to denied meals, starvation grace, deterministic health loss and death. Last-unit food/harvest contention is resolved by ascending citizen ID without negative node or town stock. Forest depletion/refill, rerouting, 720-hour replay, 100 seed map connectivity and batch/single stepping are test-covered.

**Independent review/fixes:** initial CI failed on an obsolete test that looked for the commons event only in the final bounded 120-event tail; updated the test to observe events across all 500 ticks without weakening retention policy. Stabilized the waiting-for-food activity when pantry stock is zero, avoiding a false hourly activity flip. Confirmed one canonical `WorldState`, bounded events and per-citizen history, no `Math.random()` in gameplay and no React/Phaser resource writes. Initial food/wood are explicit endowments, not magic replenishment.

**Limits:** The authored code cannot run npm/Chromium locally because the container cannot reach the registry; all PASS claims above are based on real GitHub Actions. Browser screenshots were captured automatically; a human full-device/FPS benchmark has not been performed. There is no wood consumption sink, crop seasons, carriers, NPC personal inventory, wages, backend or save/load, by design.

**Gate:** Implemented and verified, PR #3 remains open/unmerged; Phase 03 must not begin on this branch.

## Phase 01 Living World implementation and verification (2026-10-14)

**Source branch:** `feat/phase-01-living-world` from main `4fab2da4b8cf5008a1cfb0b2443e64808238ed14`. Latest verified code commit `2d981e2b896cf03ebc16dd33da97ab6a65f31991`; later documentation-only changes do not alter behavior. Phase 00's files/tests were retained.

**Delivered:** `src/sim/{prng,world,pathfinding,engine,clock}.ts` with deterministic seeded 48×48 terrain, connected village sites, 20 uniquely identified residents, monotonic event IDs, bounded events/history, pathfinding + fallback cooldown; headless hourly state transitions; separate runtime scheduler 1×/5×/20×, hidden-tab backlog discard. React `src/app/livingCoordinator.ts`, `App.tsx`, responsive CSS; Phaser `GameCanvas.tsx`, `WorldScene.ts`, `createGame.ts` render map/sprites and selection/zoom/pan without editing state. No Phase 02 mechanics.

**Verified checks (Ubuntu GitHub Actions):** [run 38506368939](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506368939) **PASS**: `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run typecheck`, `npm run lint`, `npm run test` (**23 tests**), `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e` (**2 Chromium tests**). Browser verifies 20 NPC model count, canvas dimensions, click/inspector, pause/speed/resume, pan/zoom input, 10 events, triple remount, no console errors/asset 404, responsive 390px without horizontal overflow. Screenshots: [artifact 11868235502](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506368939/artifacts/11868235502). Earlier artifact was extracted and visually reviewed: desktop, 20× after several days, narrow view.

**Simulation regressions:** exact xorshift32 sequence; 100 valid seeds; same seed 240-hour replay, batch/single equivalence; 500 ticks in Node-only Vitest; four-way legal movement, disconnected target fallback and retry cooldown, dynamic blocked future waypoint, clock rates and gap discard. Full state remains JSON-serializable; no simulation use of `Math.random()`, Phaser or React.

**Failures discovered/fixed:** first CI type errors (unused private field/import, activity literal inference), incorrect shared-workplace test assumption, impossible-path repeated retry, invalid cached waypoint, overlapping movement tweens. Failed CI runs retained as factual debugging history; final code run is green.

**Independent self-review:** one canonical state in coordinator; stable ascending NPC IDs; renderer only reads; event count bounded to 120 and per-NPC history to 8; original Foundation coordinator/test preserved. No production/wages/survival resources or persistence added. Rendering assets are procedurally drawn; no new packages.

**Limits:** No day/night tint, true wages/production, NPC collision resolution, save/load, long-term social needs, physical-phone performance evidence. 20× tested for browser responsiveness in smoke tests, not a long-running FPS benchmark. Local authoring container cannot resolve github.com/npm, so local install/build/Chromium remains **BLOCKED**; clean GitHub Actions execution above is the actual validation source. Full development dependency advisory count from Phase 00 remains a tracked pre-release concern; production audit high-level PASS.

**Gate:** Phase 01 merged to `main` through [PR #2](https://github.com/giabao2605/Tiny-Civilization/pull/2), merge commit `88398324e1e55a2ede49b093ed85f1615055c6bf`; PR CI [38506725599](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38506725599) PASS. Post-merge CI: [38507589768](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38507589768) (see linked run status). Phase 02 is the next planned phase but remains NOT STARTED.

## Phase 00 implementation handoff (2026-10-14)

**Branch:** `feat/phase-00-foundation` from main `1b44da3ad5dee1721a6b9274154f91b23165b377`.  
**Merged:** PR [#1](https://github.com/giabao2605/Tiny-Civilization/pull/1), merge commit `4c7d33e1dfe8e03c04cd0d8c5fbc6f1fe558be02`; final PR CI [38504538644](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504538644) **PASS**.  
**Purpose:** Vite + React + TypeScript strict + Phaser preview, one source of Foundation snapshot truth, inspectable tile click, mount/teardown, reproducible tests. This is NOT an autonomous simulation.

### Delivered
- `package.json`, committed `package-lock.json`, Node 22 (`.nvmrc`), npm 10, ESLint, Vitest, TypeScript, Vite and Playwright.
- React page: world canvas, placeholder HUD, tile inspector, responsive desktop/mobile layout. Phaser AUTO renders original shape-based 48×48 preview; no external runtime assets.
- Phaser `GameCanvas` boots after animation frame to avoid React StrictMode double-start; cleanup calls `game.destroy(true)`, removes prior canvas, and scene unregisters its pointer listener.
- `src/app/coordinator.ts` is the single typed Foundation snapshot/selection command owner; it rejects out-of-bounds tile selections. `src/sim/grid.ts` contains pure geometry; no time simulation yet.
- GitHub Actions: clean npm install and checks, production-dependency advisory gate, Chromium smoke, screenshot artifact. No secrets or downloaded build/cache committed.
- README updated with dev/test instructions. Original master plan, simulation contract and future phase plans preserved.

### Actual test evidence (GitHub-hosted Ubuntu runner)
- Node 22.23.3 and npm 10.9.9, GitHub Actions run [38503822373](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38503822373): `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright install --with-deps chromium` and `npm run test:e2e` all **PASS**.
- Run [38504001735](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504001735): **PASS** from committed lockfile after removing temporary bootstrap and third-party font request; smoke verified 2/2 in Chromium.
- Run [38504241274](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504241274): production dependency audit `npm audit --omit=dev --audit-level=high` PASS; same quality checks and browser smoke re-run.
- Browser: 1366×768 desktop, 390×844 narrow; one 576×576 Phaser canvas, clickable tile inspector/clear, repeated remount 3 times, visible canvas, no uncaught errors or same-origin asset HTTP >=400, no horizontal overflow. Test-saved screenshots were downloaded and visually inspected: terrain preview and panels rendered at both widths. [Screenshot artifact](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38504001735/artifacts/11867880193).
- **Local execution:** BLOCKED on authoring container: `git ls-remote` fails DNS resolution for github.com, and npm package cache is empty. Local `npm ci` or Playwright run not claimed. Fresh installation, build and browser checks ran for real in GitHub Actions instead.

### Failures found and fixed
- Initial CI attempt [38503745882](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38503745882) generated the lockfile but failed to push due to a concurrent README update (non-fast-forward). Next run successfully generated/committed the lockfile; temporary bootstrap step was removed. Final CI uses plain `npm ci`.
- Removed an unnecessary external Google Fonts import to keep Phase 00 free of network-dependent assets.
- React StrictMode double-mount avoided by deferred Phaser initialization; a dedicated remount smoke test verifies single visible canvas.

### Self-review / risks
- Contract respected: `tick = 0`, `population = 0`; renderer and React never advance a simulation clock, no fake citizens, economy or seed PRNG introduced. Phase 01 must create real deterministic world state and seeded PRNG before any ticking.
- Inputs are validated, subscriber cleanup exists, Phaser scene input listener is removed on shutdown; no redundant event bus, external UI state or backend.
- `npm ci` reported **13 advisories in the full dependency graph** (1 moderate, 10 high, 2 critical). The production-only high-severity audit passed, but dev-tool advisories should be reviewed/upgraded before public release. Do not misrepresent the full audit as clean.
- CI does not prove browser behavior on the user's physical device; Chromium on Ubuntu is verified.
- No published site, no gameplay release, no Phase 01 implementation.

### Next exact action
Phase 00 was merged and verified. Next task may implement Phase 01 only after reading the master plan, simulation contract and `docs/phases/PHASE_01_LIVING_WORLD.md`; do not implement Phase 02.

## Phase 05 — Governance, Shocks & Collective Consequences (work in progress, 2026-10-14)

- Base `main` HEAD `b25007a7f19921b9431a98253abdf994eddd0885`; post-Phase04 main Actions run [38525078595](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38525078595) succeeded. Branch `feat/phase-05-governance`; draft [PR #6](https://github.com/giabao2605/Tiny-Civilization/pull/6). **Not merged.**
- New source: `src/sim/governance.ts` and `src/sim/governance.test.ts`; updated `world.ts`, `balance.ts`, `engine.ts`, `social.ts`, coordinator, UI, E2E and CI evidence artifact name.
- Mechanics present in source: deterministic term election / empty vacancy / leader replacement, sparse social support, governed finite food-in-kind transfers, crop reduction of real harvest and regeneration, worker illness affecting health and work, bounded event IDs and visible UI. `WorldState` schema v5; market stock and money remain single owners.
- Initial CI [38527129221](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38527129221) failed **TypeScript**: `Array.findLast` unavailable in the configured target. Resolved by using reverse-copy + find; later CI is required to prove this fix.
- Regression risks under active review: adversarial competition for final food, sickness recovery while starving, deterministic state digest, leader death across a social household, fixed-seed replay, long-run conservation and real Chromium E2E. Do not mark Phase 05 DONE before the latest green workflow with benchmark output and screenshots.


### Phase 05 measured evidence and self-review (on PR #6; final head verification pending)

- **Verified** [CI 38528856617](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38528856617): clean npm, production audit, typecheck, lint, **74/74 Vitest cases**, Vite production build and **6/6 Chromium E2E** PASS. Browser screenshot/trace artifact: [phase-05-browser-evidence](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38528856617/artifacts/11877097396). This is an intermediate passing commit `dd6bffa2`; subsequent commits require their own CI PASS.
- Test fixtures explicitly verify ranked leader/social support, vacancy, leader death during crisis, same-tick competing aid requests, stock zero, cooldown, invalid/stale policy, actual harvest yield/regen loss then recovery, illness HP/work-hour loss then recovery, 75-day cooldown cycles, exact amount of guardian-owned food transferred and consumed by dependent children, and a seed-612 crisis sequence with policy activation and termination. Engine still executes existing Phase00–04 regression suites.
- **Performance** from above Actions run (Node 22 Ubuntu, 720 ticks each; units milliseconds/tick; independent of UI FPS):

  | Residents | Seed | Alive | Harvest / illness incidents | Ill / recovered | Average ms/tick | p95 ms/tick |
  | --- | --- | --- | --- | --- | --- | --- |
  | 20 | 543 | 20 | 1 / 1 | 3 / 3 | 0.482 | 1.934 |
  | 20 | 613 | 20 | 1 / 1 | 3 / 3 | 0.528 | 2.012 |
  | 50 | 543 | 50 | 1 / 1 | 6 / 6 | 1.054 | 2.922 |
  | 50 | 613 | 50 | 1 / 1 | 6 / 6 | 1.390 | 4.853 |
  | 100 | 543 | 100 | 1 / 1 | 6 / 6 | 2.408 | 8.981 |
  | 100 | 613 | 100 | 1 / 1 | 6 / 6 | 2.350 | 8.658 |

- Currency remains conserved at 2,440/6,100/12,200 for 20/50/100 initial residents across these seeds. Food/wood sources/sinks reconcile exactly against market + all citizen inventories and construction wood consumption. No 720-tick baseline deaths; that is an observed scenario, not proof all shocks are harmless. Phase 04 long-run tests still simulate 20 NPC × 180 game-days and 100 NPC × 30 days.
- **Fixed faults discovered by actual tests:** (1) unsupported ES `findLast` in TypeScript target, (2) E2E incorrectly escaped leader-ID regex, (3) hungry child aid stranded because children do not eat from own bags, (4) after targeting the adult guardian correctly, they resold the donated food before feeding the child. Correct fix is to prioritize the real household meal over market resale, not weaken the assertion. Current fixture confirms the child actually eats and food conservation holds.
- **Remaining limitation:** a special shortage fixture is gated to Vite development to allow Playwright to exercise successful UI aid; this does not expose production god-mode controls. Browser screenshot evidence does not measure 60 FPS or prove behavior on physical mobile hardware. The 30–180-day simulation tests do not prove indefinite economic stability. Avoid release/save-load work until Phase 06.

### Phase 05 final verification on feature branch (2026-10-14)

- **Acceptance:** PASS on head `3c68cea0d9355fcaa36bdb574293ea368afd2180`, [GitHub Actions #38533542563](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563). Verified `npm ci`, production-only high audit, typecheck, lint, **74/74 Vitest** across 11 suites, Vite production build and **8/8 Playwright Chromium E2E**. Browser artifact: [phase-05-browser-evidence #11879336547](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563/artifacts/11879336547).
- Last E2E addition verifies **zero market reserve** through real mobile UI, with no relief and stable overall currency; companion mobile test verifies successful in-kind release with real stock decrease and cooldown. Fixtures are gated to Vite development at world construction, never to production intervention controls.
- Node 22 / Ubuntu benchmark on final verified head, population 100 × 720 ticks: seed 543 = 100 living, 1 harvest + 1 illness, 6 sick/6 recovered, 12,200 conserved currency, mean 1.515 ms/tick and p95 5.383 ms/tick; seed 613 = 100 living, 1 harvest + 1 illness, 6 sick/6 recovered, 12,200 conserved currency, mean 1.424 ms/tick and p95 5.102 ms/tick. These numbers describe simulated CPU cost, not renderer FPS.
- Real defects addressed through CI/self-review: unsupported ES array method, E2E regex, dependent child food stranded, guardian reselling child's ration. Additional adversarial governance tests cover leader death, zero candidate, same-tick double aid and depleted reserve; scheduled shock recovery; physically reduced field output and sick-worker productivity; long-seed conservation.
- Release boundary: **Phase 05 DONE on branch, [PR #6](https://github.com/giabao2605/Tiny-Civilization/pull/6) remains unmerged** until explicitly requested. Phase 06 persistence and final release remain out of scope. CI still emits third-party Node deprecation and Vite bundle-size warnings; no physical Android hardware FPS certification is claimed.
