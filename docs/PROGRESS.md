# Tiny Civilization — Progress / handoff log

**Updated:** 2026-10-14  
**Current stage:** Phase 02 merged into main at `0c8db616` and main CI [38510396152](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38510396152) passed. **Phase 03 implemented, final CI/review in progress** on `feat/phase-03-economy`, draft [PR #4](https://github.com/giabao2605/Tiny-Civilization/pull/4). No MVP release.  
**Authoritative roadmap:** [MASTER_PLAN](MASTER_PLAN.md)  
**Rules/contract:** [SIMULATION_CONTRACT](SIMULATION_CONTRACT.md)

| Phase | Status | Gate |
| --- | --- | --- |
| 00 Foundation | DONE, merged to main | npm ci, typecheck, lint, Vitest, build, Playwright Chromium PASS |
| 01 Living world | DONE, merged to main (PR #2) | 48×48 map, 20 purposeful agents, inspector, controls; CI PASS |
| 02 Survival | DONE, merged (PR #3) | Finite food/wood, needs, production, shortage/death and verified 10-seed balance |
| 03 Economy | IMPLEMENTED, final CI/review in progress (draft PR #4) | 100 agents, finite transactions, sustainable seeded runs |
| 04 Social | NOT STARTED | Persistent relationships, legible social causes |
| 05 Governance | NOT STARTED | Policies/crises with costs and real consequences |
| 06 Quality | NOT STARTED | Save/load determinism, profiling, UX/balance |
| 07 MVP release | NOT STARTED | CI green, deployed playable build |
| 08 Expansion | DEFERRED | Only after MVP validation and new go/no-go |

## Phase 03 Economy, housing and 100 NPCs (2026-10-14)

**Status: implemented on feature branch; awaiting final CI and PR review, not merged.** Development branch created from main merge commit 0c8db616. Draft PR: https://github.com/giabao2605/Tiny-Civilization/pull/4. No auto merge.

**Implemented source (requires green CI):**
- src/sim/world.ts: 20/50/100 deterministic worlds; unique IDs; bounded site capacities, nullable homelessness, citizens' wallets and owned goods, one market/treasury, construction records, expanded finite field/forest production nodes.
- src/sim/economy.ts: atomic buy/sell with enough funds, owned stock, location, storage capacity and live citizen checks; wood reservation at construction start, paid hourly builders and house completion.
- src/sim/engine.ts: stable ascending NPC effects; physical harvested goods enter NPC bags, travel and one-hour market trades, paid meal purchases, self-owned meals, finite builders and survival priority; events read from committed simulation.
- src/sim/balance.ts: integer prices, fixed initial cash, population-scaled map resources, node slot caps, house costs/durations and cooldowns.
- src/app/App.tsx, livingCoordinator.ts and WorldScene.ts: population choice, responsive inspectors/dashboard, wallets, trade history, builder progress, market marker and dynamically completed houses; no React/Phaser economy mutations.
- economy.test.ts, benchmark.test.ts, updated survival and browser smoke suites: conservation and failed trade tests, parallel buyers/builders, no free-food escape, 720-tick 100-NPC scenarios and Chromium 100-NPC coverage.

**Ownership:** Market warehouse equals the existing WorldState.inventory (not duplicated). NPC bags are separate and finite. Initial supply is 122 coins per NPC (32 in citizen wallet, 90 at market); trades and builder wages are transfers. Initial fixed food prices 3/4 and wood prices 2/3 were adjusted to 3/3 and 2/2 after the first 30-day baseline exposed treasury hoarding and bankruptcy loops. Subsequent CI must validate the rebalance. Houses hold 4 residents; construction consumes 8 market wood at initiation and 8 paid hours. Details in SIMULATION_CONTRACT.md.

**Verification history:** Initial PR CI run [38511631535](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38511631535) failed strict TypeScript on new null house ID and literal narrowing; these were addressed on later commits. Subsequent full CI [38513369596](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513369596) passed npm ci, production audit, typecheck, lint, 42 Vitest tests, production build and 4 Chromium Playwright tests. The post-review two-way-trade adjustment is undergoing separate final PR CI. The authoring container cannot resolve GitHub/npm (git ls-remote DNS error), so GitHub-hosted Ubuntu Actions is the execution environment.

**Measured 30-day baseline, prior to final circulation adjustment:** 10 seeds each at 20/50/100 NPC, 720 hourly ticks per seed, all 20/20, 50/50 and 100/100 alive. No item/money duplication and no negative balances in conserved snapshots. Aggregate total money 2,440 / 6,100 / 12,200 respectively. Large settlements construct 5 additional wood-funded houses from initial capacity 80 to 100. Run [38513369596](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513369596) records per-seed counts and transactions. Measured 100-NPC 720-tick Node-only benchmark on Ubuntu Node v22.23.3: average 1.328 ms/tick, p95 5.364 ms/tick, 37,360 BFS calls (51.89/tick). Heap delta was GC-sensitive and cannot prove a leak-free browser. [Chromium screenshots artifact](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38513369596/artifacts) includes desktop, mobile and 100-NPC screenshot.

**Bugs exposed and fixed:**
1. Strict TS nullability and narrowed-literal errors from schema v3, fixed before CI.
2. Playwright ambiguous “Tạo lại” selector, fixed with exact match.
3. 50 NPC formerly died with market wood storage at 179/180: seller attempted to deposit 2 units in the last 1-unit slot, was rejected repeatedly, blocked farming and exhausted wallet. Engine now chooses a legal quantity based on free space and finite cash; a permanent regression test guards this case.
4. Worker frequently changed work nodes and lost progress; stable node preference avoids oscillation while keeping capacity limits.
5. Long-run monetary audit found little consumer purchasing because farmers ate owned harvest. Adjusted to allow safe sale of a full harvest then purchase of a meal, preserving the emergency ability to eat personally owned food. Lower wholesale prices food 2/retail 3 and wood 1/retail 2 retain market liquidity; the spread is retained in the finite market treasury. New directional cumulative commodity counters make genuine market circulation auditable. **This final change must pass its own 10-seed and E2E checks before Phase 03 is certified.**

**Independent review:** Verified stable ID-order settlement, no magic wages, finite endowments, atomic last-unit trades, personal vs market inventory conservation, one-time material reservation, paid builder work, deceased citizens blocked from trading/building, legal construction tiles, housing capacity, bounded history, single WorldState and no simulated action from React/Phaser. No Phase 04 features added.

**Open limits and acceptance:** Final SHA requires CI PASS; Chromium responsiveness at 20× was E2E-tested but a numerical 60-FPS claim is NOT made. Memory heap delta cannot prove absence of leaks, and screenshots are retained as CI artifacts rather than manually visually certified. Save/load remains Phase 06; autonomous wood purchases only occur when there is a practical demand, although the atomic wood purchase API is covered by tests. No unlimited income/food, bank, AI agents or backend. Draft PR must not merge automatically.

---

## Phase 02 Survival implementation and verification (2026-10-14)

**Branch:** `feat/phase-02-survival` from main `d6420cc07c59d1a4bb70a38fa353e5eec3cafd47`. **PR:** [#3](https://github.com/giabao2605/Tiny-Civilization/pull/3), deliberately not merged. Scope is limited to Phase 02.

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
