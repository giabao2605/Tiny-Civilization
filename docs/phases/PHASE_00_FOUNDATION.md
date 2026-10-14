# PHASE 00 — Foundation and vertical architecture spike

**Tóm tắt tiếng Việt:** Dựng ứng dụng nền, test tự động và giao diện Phaser. Chỉ được qua phase khi thật sự mở được web, build và test chạy.

**Status:** NOT STARTED · **Depends on:** none · **Target:** minimal working browser app + repeatable tests, NOT a feature-complete game.
**Scope boundary:** no citizen economy/social mechanics, no backend, no full art pack, no speculative engine framework.

## User-visible success story

Opening the local dev URL shows a clean Tiny Civilization shell with a Phaser-rendered placeholder grid inside a React layout. The browser doesn't double-create canvases on refresh/navigation. A named test command and production build pass from a fresh checkout.

## Slice-by-slice implementation plan

### 00.1 Repository hygiene and reproducibility
- [ ] Inspect branch/current files before writing. Do not overwrite planning docs or user modifications.
- [ ] Scaffold **Vite + React + TypeScript** into repo root; use npm and commit `package-lock.json`.
- [ ] Pin Node LTS major via `.nvmrc` and mention npm version expectations in README; use versions supported by all chosen tools. Pin compatible installed dependency versions in lockfile, not vague untested "latest".
- [ ] Add strict TypeScript, ESLint for project sources, predictable formatting (simple config, avoid adding three formatters), `.gitignore` for `node_modules`, `dist`, output and local caches.
- [ ] Add scripts: `dev`, `build`, `lint`, `test`, `test:e2e` (and `typecheck` if `build` alone does not run TS).
- [ ] Add a concise development README with install, run, test and troubleshooting instructions; explain that the repository currently has no release.

### 00.2 UI / game renderer bridge
- [ ] Create a small React shell with header, canvas area, placeholder HUD/inspector column and footer. Use simple CSS; no global state library.
- [ ] Mount exactly one Phaser Game within a React-owned container, with proper resize and game instance teardown on unmount; use `Phaser.AUTO` renderer fallback.
- [ ] Render a primitive tile grid/camera preview using generated shapes or original minimal tiles, avoiding external paid sprites.
- [ ] Define narrow bridge interface: React sends validated UI commands; Phaser emits selections; simulation snapshot comes from one coordinator. No React state mutation from Phaser render loop.
- [ ] Keep world simulation out of this phase except a typed placeholder; optional standalone empty tick method can be created without premature abstraction.

### 00.3 Automated testing and CI starting point
- [ ] Configure **Vitest** and write one useful pure TypeScript test, e.g. coordinate bounds or time conversion, not only `expect(true).toBe(true)`.
- [ ] Configure **Playwright Chromium** one smoke flow: page loads, title visible, single canvas exists, no uncaught browser errors, UI doesn't create second canvas after rerender.
- [ ] Add a minimal GitHub Actions workflow for npm ci → typecheck → lint → unit test → build. Browser E2E in CI only if installation runtime fits; otherwise add by phase 01/07 and document current gap.
- [ ] Verify locally with real commands and inspect browser screenshot. If current environment cannot run browser, mark that check blocked rather than pretending.

## Proposed files (adjust only to simplify)

- `index.html`, `vite.config.ts`, `tsconfig*.json`, `package.json`, `package-lock.json`, `.nvmrc`
- `src/main.tsx`, `src/app/App.tsx`, `src/game/GameCanvas.tsx`, `src/game/scenes/WorldScene.ts`, `src/styles/app.css`
- `tests/e2e/smoke.spec.ts`, one `src/sim/*.test.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`

## Tests, negative cases, evidence
1. Fresh `npm ci` followed by `npm run build`, `npm run lint` and `npm run test` succeeds.
2. Browser navigates to app and sees **one** Phaser canvas; unmount/remount does not leak event handlers or create duplicate games.
3. Browser is usable at 1366×768; at narrower width panels do not cover/erase canvas or crash (nice layout, not full mobile UX).
4. Browser console shows no uncaught exception and network panel no core asset 404.
5. Verify git diff contains no package caches, `.env` secrets, binaries with unknown licenses or accidental credentials.

## Exit / gate to phase 01

**DONE only when:** baseline commands actually pass, Playwright smoke succeeds or a specific fixable browser gap is recorded, and the game canvas displays in a real browser. Update `docs/PROGRESS.md` with commands/results and commit.

**Reject / do not add now:** database, ECS framework, state machines package, animation studio, custom UI toolkit, cloud auth, metric service or 20 placeholder NPCs pretending to prove gameplay.

## Double-check before marking DONE
- React Strict Mode/mount behavior tested?
- Phaser lifecycle clean on page changes?
- Dependencies pinned and setup reproducible on another machine?
- Is the code readable enough to modify when phase 01 creates real world state?
