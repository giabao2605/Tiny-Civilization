# Phase 08A — desktop-local readiness audit

**Owner scope update (2026-10-15):** PC Chrome/Edge on localhost is sufficient. **No GitHub Pages / deployment required. Android/mobile is out of acceptance scope.**

**Current decision: NO-GO / pending real player feedback and desktop scale evidence.** This document is an audit and preparation plan only, not a simulated playtest or authorization to change WorldState.

## Verified evidence

- Phase 07 merged at main commit `1d56f01924f160f45dfb6a7319850ee41a311935` via PR #8.
- [Main CI #38676668747](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676668747): PASS with automated unit, E2E Chromium and Pages-path preview smoke. [PR #9 interim CI #38677585292](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38677585292) PASS before this scope revision; the final revised commit needs fresh CI.
- Historical Phase 07 benchmark on GitHub runner: 100 NPC / 1,000 simulation ticks Node p95 ~4.738 ms/tick; 100 NPC 20x short Chromium sample ~30 mean FPS, p95 frame ~66.8ms. **Not** proof of extended desktop gameplay, not a two-village scaling guarantee.
- Save format 1, engine `sim-v5-phase06`; preserve old saves. Deterministic single-village replay tested in Phase 06/07.
- Github Pages was previously blocked ([main run #38676669541](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676669541)). Owner enabled Actions as Pages source, but **deployment is no longer a dependency**. Any web deployment result is historical/optional.

## Desktop-local gate matrix

| Gate | Current verification | Decision |
| --- | --- | --- |
| CI on merged Phase 07 main | Run #38676668747 success | PASS |
| Desktop local app, controls and JSON saves on built production files | Chromium preview evidence exists, final local-root-path E2E added to PR #9 | Verify final CI; manual PC session unverified |
| Seed determinism, 1000 ticks vs 500+restore+500 | Phase 06 automated regression evidence | PASS for one village only |
| 100 NPC PC responsiveness/headroom for two settlements | Short Ubuntu CI measurements only | NEED measured sustained Chrome/Edge PC session; smaller total NPC budget permitted |
| Independent novice observation for 30–180 game-days | No playtest records | NO-GO |
| Trade has meaningful extra observable consequences | Hypothesis only, no measured player feedback | NO-GO |
| Owner accepts 08A scope/balance/migration risk | No explicit GO for 08A code | NO-GO |
| GitHub Pages and Android | Owner says local PC is enough | **NOT REQUIRED** |

No 08A simulation/schema work is permitted while the remaining substantive gates are unverified or absent an explicit informed owner override.

## Run the playable game on Windows desktop

Open PowerShell in the repository root with Node.js 22 and npm 10 installed:

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173/` on Chrome or Edge. For an actual release-build trial:

```powershell
npm run build
npm run preview
```

Open `http://localhost:4173/` (or the exact URL printed by Vite). **Do not open** `dist/index.html` with a `file://` URL. `localStorage` on 5173 and 4173 are separate origins, so use JSON export/import when switching ports.

Smoke-check: canvas and NPC visibility; 20 and 100 initial NPCs; pause/1x/5x/20x; click an NPC and an event; inspect market and policy; save, hard-refresh, reload; export JSON and re-import; invalid JSON must leave the current world unchanged. Record browser console exceptions/assets failures. Automated desktop *local production* test: `tests/e2e/local-desktop.spec.ts` (enabled in CI by `PLAYWRIGHT_LOCAL_PRODUCTION=true`). The historical mobile viewport tests can remain as regressions but are not a sign-off gate.

## Independent novice PC playtest (NOT PERFORMED)

Get at least two independent observers unfamiliar with the design. Note actual local build SHA, browser version, PC CPU/RAM, viewport, seed, dates and game ticks reached, and whether they required intervention.

1. First minute: Can they start watching, pause/change speed and inspect an NPC without help?
2. At 10 real minutes: Can they explain a true event's causes and effects via the timeline and inventory, without interpretation being fed to them?
3. Run one or more scenarios across at least 30 in-game days (tick >= 720), and sample 180 in-game days (tick >= 4320) if feasible. Capture actual elapsed time and all interruptions; never invent feedback.
4. Collect the top three confusion points, event/seed/tick worth following, willingness to continue, and specific story opportunities a second settlement plus finite trade could add.
5. Keep the feedback, screenshot and reproducible bug notes. Do not infer game is engaging solely from scripted successful clicks.

## Sustained PC performance test (NOT PERFORMED)

On desktop Chrome/Edge run 20, 50, 100 NPC at 1x/5x/20x. Record CPU, RAM, browser version, seed, wall duration, p50/p95 tick (in Node), measured frames p50/p95/FPS (in browser) and memory trend. A GPU-accelerated local desktop differs from headless CI. No 60 FPS claim without measurement. For 08A, plan an initial **fixed total NPC budget** split across two villages, avoiding accidental 200-NPC scaling; measure 30 in-game days and simultaneous shipments.

## 08A architecture sketch (documentation only)

Keep one deterministic engine rule set shared by two named settlements with stable ownership. First capture valid format-1 `sim-v5-phase06` save fixtures and write a validated migration strategy for a genuine WorldState change. Reject incompatible states non-destructively. Test 1000 continuous ticks vs 500+save/load+500 on multiple seeds with active shipments.

Shipment rules need finite source inventory and currency, a single identifiable escrow/transit ownership state, fixed capacity and travel time, deterministic stable-order resolution, recoverable save/load and explicit route blockage / failed destination / owner death outcomes. Never create food, wood, money or ghost NPCs in transit. Phaser renders; only simulation decides. Diplomacy (08B) and limited conflict (08C) remain separate optional phases.

## Next GO review

Require green final PR CI on the local built desktop smoke, at least some *actual* independent PC gameplay evidence, a measured reasonable desktop NPC performance envelope, demonstrable narrative value from trade and owner acceptance. Optional Pages/Android must not delay this review. Document which gates remain waived if the owner explicitly changes the scope again.
