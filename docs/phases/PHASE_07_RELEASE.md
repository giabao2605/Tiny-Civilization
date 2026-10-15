# PHASE 07 — MVP release and operational handoff

**Tóm tắt tiếng Việt:** Đóng gói và phát hành bản web chơi được; CI xanh, mở URL thật, xác minh save/reload, liệt kê giới hạn còn tồn tại.

**Status (2026-10-15):** Phase 07 source merged to main (PR #8) and main CI PASS. Owner now accepts desktop-local play; website publication and Android are optional. Independent novice PC playtest and sustained PC performance still open.
**Intent:** Ship a real playable browser game, not a zip of hopeful source code.

## Release definition

A localhost Chrome/Edge PC session against the production build or development server opens a playable Tiny Civilization. Public hosting is optional by owner decision. A new player can start a world, observe 100-agent scenarios, pause/change speed, inspect causes, and save/restore. Source, test results and known limitations are discoverable from GitHub.

## 07.1 Freeze and release checklist
- [ ] Confirm every prior phase acceptance gate with actual evidence in `docs/PROGRESS.md`; re-open phase if any critical regression exists.
- [ ] Freeze and document current dependency versions, game/save schema version and supported primary browser (Chromium-based desktop first).
- [ ] Final npm clean install, typecheck, lint, unit/integration tests, Playwright smoke and production build.
- [ ] Check game from **built production files** served locally, not only Vite dev server.
- [ ] Verify asset licenses/attributions, favicon/title/meta description, relative paths and no missing files.
- [ ] Validate no hardcoded credentials, secrets, debug backdoors or needless network API calls.
- [ ] README: install/run/test/play instructions, screenshots, limitations, explanation of seed/controls and asset credits.

## 07.2 GitHub Actions / optional website deployment
- [ ] Run CI on pull requests to `main` and on pushes to `main`: npm ci, strict typecheck, lint, unit test, build; E2E Chromium at least on release branches or each PR if runtime permits.
- [ ] Prefer GitHub Pages for this public repo, generated static build from Vite. Set appropriate base path for project Pages (`/Tiny-Civilization/`) or use verified deployment host config.
- [ ] Ensure GitHub Actions deployment permissions/workflow match repo settings; do not declare "deployed" if Pages is disabled or requires owner settings.
- [ ] Deploy from versioned build artifact; do not embed owner credentials in code or commit tokens.
- [ ] Open deployed URL in browser: hard refresh, new save, play several days, speed controls, selected NPC inspector, save/reload.
- [ ] Record live URL, commit hash, build/test artifacts and date when actual deployment succeeds.

## 07.3 User-facing clarity and fallback
- [ ] Display project title, version, controls and observer instructions.
- [ ] Explain save locality and how JSON export avoids browser data loss.
- [ ] Provide "Reset world" with confirmation and preserve good saved world until user confirms.
- [ ] Clearly label beta/MVP limits: one settlement, simplified economy/governance, desktop-first, no multiplayer/cloud sync.
- [ ] Add a feedback channel via GitHub Issues with a reproducible bug template: seed, tick, steps, browser, screenshot, save JSON optional.
- [ ] Ensure public examples/screenshot don't contain private user data.

## 07.4 Release tests / go-no-go

- [ ] Fresh desktop browser opens site without runtime exception or missing core assets.
- [ ] Start same seed twice and check visible world identity; after save+reload actions continue coherently.
- [ ] 20 and 100 NPC scenarios playable; 20× responsive per measured reference and documented limits.
- [ ] Forced shortage test reports cause, actual stock depletion and physical NPC consequences.
- [ ] Relationship, policy and shock stories reproducible with fixture seeds; not mere decorative popups.
- [ ] All automated tests green; no unresolved critical/high bugs; no known silent save deletion.
- [ ] Release notes explain what's built and what's not; do not mention phase 08 as already shipped.

## After release
- Capture feedback around **is it watchable**, **is it legible**, and **is there enough genuine emergent difference among seeds**.
- Rank issues by crash/save-loss > rule correctness > player clarity > visual polish > optional mechanics.
- Fix blocking bugs before new expansion. Create version tag/release when owner wants formal milestone.
- Make an explicit go/no-go decision on `PHASE_08_EXPANSION.md` after observing a deployed v1.

## Exit gate

**Desktop-local DONE** requires a reproducible clean build, playable local Chrome/Edge session, reliable saves, automated and actual desktop-playtest evidence, and updated progress. Public URL and Android performance are not required as of owner override. Source pushed without actual player validation remains **PARTIAL**, not done.

## Phase 07 implementation ledger (2026-10-15, pre-final CI)

- [x] Verify Phase 06 merge commit `efa9fa23` and post-merge main CI success.
- [x] Prepare `0.9.0` release-candidate UI/metadata, clear observer and local-save guidance, safe reset, Phaser remount on import and visible GitHub Issues link.
- [x] Implement code paths for Vite Pages base, deployment workflow, production-preview Chromium smoke with 3 viewport sizes and bug-report template.
- [x] Add minimal renderer optimizations without changing simulation laws or save schema.
- [ ] Re-verify full CI at final PR head, collect browser FPS/p95 before/after and inspect screenshots.
- [ ] Verify actual Pages deployment, public URL hard refresh and browser console/network.
- [ ] Independent first-time player usability session (NOT TESTED).
- [ ] Desktop PC Chrome/Edge sustained-session performance (NOT TESTED outside CI); Android not required.

**Decision:** PARTIAL until the desktop-local and real-player gates pass. Website deployment is optional. The items marked implemented do not imply their remote CI/browser execution has succeeded; that evidence belongs in `docs/PROGRESS.md`.

## Post-merge verification update (2026-10-15)

- Phase 07 PR #8 was merged into main at `1d56f01924f160f45dfb6a7319850ee41a311935`.
- [CI main #38676668747](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676668747) **SUCCESS**.
- [Pages main #38676669541](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676669541) **FAILURE** at configure-pages; deploy skipped, live URL not verified.
- Historical public deployment remains unverified; owner later decided that this is **not** a prerequisite for local PC play.
- Desktop Chrome/Edge playtest and longer in-session performance remain unverified. See [desktop-local readiness audit](../PHASE_08_READINESS.md).


## Owner override (2026-10-15): PC localhost only

Public website deployment, Pages Settings and Android/phone FPS are not required for Phase 07 desktop acceptance or Phase 08 prerequisites. Keep the GitHub Pages workflow available as a non-blocking option. Run `npm ci && npm run build && npm run preview` and open the local URL in Chrome/Edge; use automated desktop production smoke and record independent user playtest before marking desktop release DONE. This section supersedes public-deploy/Android requirements and unchecked items above where they conflict.
