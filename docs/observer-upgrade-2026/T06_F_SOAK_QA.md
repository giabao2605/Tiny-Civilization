# T06-F — Real-time soak protocol and evidence

**No 5/30/60/120 minute physical soak was run during this task. All durations below remain NOT RUN and all new per-duration numeric metrics NOT MEASURED.** Do not treat source instrumentation or Node golden tests as a soak.

| Actual wall-clock run | Result | Evidence |
| --- | --- | --- |
| 5 minutes (short validation) | NOT RUN | `T06F_SOAK_MINUTES=5` |
| 20–30 minutes (medium) | NOT RUN | `T06F_SOAK_MINUTES=30`; exactly 30 minutes |
| 60 minutes | NOT RUN | `T06F_SOAK_MINUTES=60` |
| 120 minutes | NOT RUN | `T06F_SOAK_MINUTES=120` |

## Windows PC instructions
Open PowerShell in repository checkout, Node 22.12+ / npm 10:

```powershell
npm ci
npx playwright install chromium
npx playwright test tests/e2e/t06f-lifecycle.spec.ts --workers=1
$env:T06F_SOAK_MINUTES = "5"
npx playwright test tests/e2e/t06f-soak.spec.ts --workers=1
$env:T06F_SOAK_MINUTES = "30"
npx playwright test tests/e2e/t06f-soak.spec.ts --workers=1
$env:T06F_SOAK_MINUTES = "60"
$env:T06F_SOAK_AUDIO = "1"
npx playwright test tests/e2e/t06f-soak.spec.ts --workers=1
$env:T06F_SOAK_MINUTES = "120"
npx playwright test tests/e2e/t06f-soak.spec.ts --workers=1
Remove-Item Env:T06F_SOAK_MINUTES,Env:T06F_SOAK_AUDIO -ErrorAction SilentlyContinue
```

Existing `E04F_SOAK_MINUTES=60|90|120` script is preserved. Both use actual wall time, never accelerated timers. **60 and 120 minute variants are intentionally not part of Fast CI**, which has a 20-minute job timeout.

## Measurement and acceptance
- Fixed world: native v6 96×96, 100 NPC, seed 1, 1× and Fit at 1920×1080; actual weather observed. Tick must increase, save v6 successful; no fake NPC.
- Samples: 0, 5, 10, ... 60/120 minutes, screenshots at each nonzero checkpoint. Record actual elapsed milliseconds, cpu/browser metadata, Phaser FPS/delta, rAF cadence quantiles (not GPU time), JS heap nullable, audio/ambient/particle budgets, scene objects, textures, errors and unhandled rejections.
- Save output: Playwright `test-results/` contains `t06f-soak-report.json` and PNGs. Capture terminal logs labeled `T06F_SOAK`. Keep screenshots only if runner actually captured them.
- During separate *manual* human test: physically listen for bird/cart/bell/stereo balance and inspect weather, AFK transitions and gameplay legibility; annotate output device and exact Windows build. A headless browser cannot certify listening.
- Suspected leaks: stable map/population repeated GC-aware used heap increases plus retained handles/listeners should be investigated. Legitimate site growth, browser caching, and delayed GC must be excluded. No universal magic RSS threshold is set.
- End-state: no duplicate canvas, no runtime errors, no out-of-budget handles/voices, no giant catch-up, no save schema change. A `PASS` short soak alone does not certify leak-free 120m.

If Playwright/browser is unavailable, record **NOT RUN** rather than replacing wall time with a synthetic clock.
