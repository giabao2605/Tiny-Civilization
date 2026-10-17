# W02-F — Local Windows PC Smoke and Soak Protocol

**Status:** NOT RUN by the GitHub CI assistant. Not hardware-certified. This file is a repeatable *manual* checklist only. It is not proof Windows tests happened.

## Prerequisites

Windows 10/11, Node.js **22** matching `.nvmrc`, PC browser Chrome or Edge, sufficient RAM, branch `feat/w02-f-map-density-performance`. Close unrelated GPU-intensive applications. Record CPU model, RAM, GPU/driver, display scaling, browser version, Windows build and available power mode. Run in the *same* device/power mode for all repeated samples.

From repository root in PowerShell:

```powershell
git fetch origin
git switch feat/w02-f-map-density-performance
git pull --ff-only
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

Open Vite's reported local URL (normally `http://localhost:5173/`). This is **local-only**, no deployment or GitHub Pages required. For automated Chromium metrics on the dev server route, use `?observerPerf=1` and the available Playwright W02-F scripts:

```powershell
npx playwright test tests/e2e/observer-w02-f-perf.spec.ts --workers=1
npx playwright test tests/e2e/observer-w02-f-visual.spec.ts --workers=1
```

The automation uses its own test webServer configuration on port 4173. Avoid using the same port for a separate dev server, and do not mistake headless Chromium metrics for interactive hardware FPS.

## Visual and gameplay matrix

At 1366×768, 1920×1080 and 2560×1080 plus one smaller window, inspect 96×96 Fit, Reset, zoom, pan, NPC click and Follow. Confirm homes' gates, civic plaza/stalls/roads and natural lake banks are distinct. Confirm NPCs are not obscured and no decoration appears to create a traversable bridge on water. Reset to 20, 50, 100 NPC and test 1×, 5×, 20×; check tick advances, Pause freezes ticks, hidden tab does not catch up, save v6 96×96 roundtrip and imported frozen v5 remains 48×48.

## 60–120 minute soak

Use one fixed seed (`12345`), 100 NPC, 20× for at least 60 minutes at 1920×1080. Also spend time moving between Fit/Follow/close-up views; at minute 0/15/30/45/60 (and 90/120 for extended soak) record:

| Elapsed minute | Camera/zoom | FPS avg and p95 frame ms | JS heap MB | Renderer GPU process MB | Tick count | Browser errors / screenshot |
|---|---|---|---|---|---|---|
| 0 | | | | | | |
| 15 | | | | | | |
| 30 | | | | | | |
| 45 | | | | | | |
| 60 | | | | | | |

Use Chrome DevTools Performance/Memory and Chrome Task Manager (Shift+Esc), alongside Windows Task Manager. Save actual screenshot files, Playwright traces/JSON if used, PC specifications, and error console logs. If available, compare initial and final heap after forcing GC in DevTools under comparable conditions. A single fluctuating heap sample does not establish a memory leak. Check repeated canvas remount, selection and zoom labels; the game must retain one visible canvas.

### Acceptance

**PASS** only with measured usable gameplay at all populations/speeds, stable behavior over soak, no crash/critical memory growth, and deterministic/save regressions green. Do not invent a 60 FPS minimum if hardware does not sustain it; report actual FPS alongside quality decision. **FAIL** for repro crashes/leaks/teleports/corrupt saves. **NOT RUN** if absent Windows evidence. Leave Windows certification **PARTIAL** until an actual target PC performs this work.

Rollback: keep PR #21 unmerged; revert its optimization commits rather than changing W02-A golden fixtures, simulation RNG or schema.
