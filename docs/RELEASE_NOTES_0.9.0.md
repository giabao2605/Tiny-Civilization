# Tiny Civilization · 0.9.0 MVP Release Candidate

**Status (2026-10-15):** Phase 07 source merged into `main` via [PR #8](https://github.com/giabao2605/Tiny-Civilization/pull/8) at `1d56f019`; [post-merge CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676668747), but [post-merge Pages FAILED](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676669541) at configure-pages and deploy was skipped. No verified public URL or official v1.0.0 tag. Phase 08A remains NO-GO pending real playtest and hardware evidence.

## Game content

One deterministic 48×48 settlement with 20, 50 or 100 starting NPCs; hourly simulation; real inventories, employment, market trades, construction, relationships, households, births and deaths; governance with finite food-aid decisions, poor-harvest and illness shocks. Select a citizen or a causal event to understand why outcomes happened. Time controls are Pause, 1×, 5× and 20×.

## Persistence

Local browser slot and manual JSON export/import. Save format 1, engine schema `sim-v5-phase06`; no backward save migration. New world creation requires confirmation; browser save is retained until explicitly saved over. Browser storage is device/browser-specific, NOT cloud save. Keep a JSON backup; quota exhaustion or clear-site-data can make local storage unavailable. JSON imports are validated before changing the running world.

## Deployment instructions for repository owner

1. Phase 07 PR #8 has already been merged. Confirm the post-merge CI run above at the exact main commit before touching Pages Settings.
2. Open repository **Settings → Pages → Build and deployment**. Set **Source** to **GitHub Actions**. The GitHub App connection does not expose this admin setting.
3. Review [Pages workflow](../.github/workflows/pages.yml). Pushes to main invoke it; deployment runs only after audit, code/test/build and both dev and production-preview browser smoke pass. A separate readiness PR adds real live-site Chromium verification following a successful deploy.
4. Check the workflow **Tiny Civilization Pages**: successful `verify-build`, `deploy` and, once the readiness PR is merged, `verify-live` jobs; then independently visit `https://giabao2605.github.io/Tiny-Civilization/` with hard refresh and fresh storage.
5. Verify canvas/assets, 20/100 NPC at 1×/20×, selected inspector, save/reload/import, console/network, and mobile viewport. Record URL, run, screenshot, commit, date in PROGRESS. If URL is inaccessible or deploy blocked, remain PARTIAL.
6. Do **not** auto-merge the Phase 08 readiness PR, start multi-settlement architecture, or create a v1.0.0 tag without separate approval and relevant evidence.

## Quality evidence and known limitations

Phase 06 main CI after merge passed (run #38673629622). Historical 100 NPC / 20× Chromium CI frame sample: ~25 FPS, 83.3 ms p95. Release-candidate after-change measurements require fresh CI evidence. First-time novice playtest, Android physical device FPS and sustained hours-long UI soak have **NOT** been performed.

This is a desktop-first, single-village game. No cloud sync, mobile performance guarantee, backend, accounts, multiplayer or Phase 08 systems. For reproducible defects file a [GitHub issue](https://github.com/giabao2605/Tiny-Civilization/issues) with seed, tick, browser and reproduction steps. All tiles and citizen icons are drawn procedurally via Phaser; the favicon is an original SVG in the repository. Third-party libraries retain their respective licenses.
