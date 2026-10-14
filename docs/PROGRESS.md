# Tiny Civilization — Progress / handoff log

**Updated:** 2026-10-14  
**Current stage:** Phase 00 Foundation **DONE on feat/phase-00-foundation**, pending PR merge to main; NO gameplay released.  
**Authoritative roadmap:** [MASTER_PLAN](MASTER_PLAN.md)  
**Rules/contract:** [SIMULATION_CONTRACT](SIMULATION_CONTRACT.md)

| Phase | Status | Gate |
| --- | --- | --- |
| 00 Foundation | DONE on implementation branch (PR review pending) | npm ci, typecheck, lint, Vitest, build, Playwright Chromium PASS |
| 01 Living world | NOT STARTED | 48×48 map, 20 purposeful agents, inspector, controls |
| 02 Survival | NOT STARTED | Finite food/wood and consistent needs/actions |
| 03 Economy | NOT STARTED | 100 agents, finite transactions, sustainable seeded runs |
| 04 Social | NOT STARTED | Persistent relationships, legible social causes |
| 05 Governance | NOT STARTED | Policies/crises with costs and real consequences |
| 06 Quality | NOT STARTED | Save/load determinism, profiling, UX/balance |
| 07 MVP release | NOT STARTED | CI green, deployed playable build |
| 08 Expansion | DEFERRED | Only after MVP validation and new go/no-go |

## Phase 00 implementation handoff (2026-10-14)

**Branch:** `feat/phase-00-foundation` from main `1b44da3ad5dee1721a6b9274154f91b23165b377`.  
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
Review/merge the Phase 00 pull request after required checks pass, then explicitly authorize starting Phase 01. Do not start Phase 01 automatically.
