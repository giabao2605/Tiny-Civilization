# Tiny Civilization — Progress / handoff log

**Updated:** 2026-10-14  
**Current stage:** Phase 01 Living World **DONE, merged into main via PR #2 (CI PASS)**. Phase 00 previously merged via PR #1; Phase 02 NOT STARTED; no MVP released.  
**Authoritative roadmap:** [MASTER_PLAN](MASTER_PLAN.md)  
**Rules/contract:** [SIMULATION_CONTRACT](SIMULATION_CONTRACT.md)

| Phase | Status | Gate |
| --- | --- | --- |
| 00 Foundation | DONE, merged to main | npm ci, typecheck, lint, Vitest, build, Playwright Chromium PASS |
| 01 Living world | DONE, merged to main (PR #2) | 48×48 map, 20 purposeful agents, inspector, controls; CI PASS |
| 02 Survival | NOT STARTED | Finite food/wood and consistent needs/actions |
| 03 Economy | NOT STARTED | 100 agents, finite transactions, sustainable seeded runs |
| 04 Social | NOT STARTED | Persistent relationships, legible social causes |
| 05 Governance | NOT STARTED | Policies/crises with costs and real consequences |
| 06 Quality | NOT STARTED | Save/load determinism, profiling, UX/balance |
| 07 MVP release | NOT STARTED | CI green, deployed playable build |
| 08 Expansion | DEFERRED | Only after MVP validation and new go/no-go |

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
