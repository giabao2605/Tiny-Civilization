# E04-B Implementation & Verification — day/night presentation

**Date:** 2026-10-19  
**Branch:** `feat/e04-b-day-night-lighting`  
**Entry:** PR #29 merged as `90fe91292d4a20f6f747928f5ab81ec9422cccfb`; post-merge [Fast CI #39213160232](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39213160232) completed SUCCESS for the same merge SHA.  
**Scope:** Presentation only. No E04-C/D/E/F weather, shelter, audio, economy or scheduler.

## Architecture

- `src/game/render/lighting.ts`: pure 24-hour color/light curve, four named phases, bounded frame interpolation, art-kit-relative aperture placement and seeded road selection. `lightingAtTick` delegates to canonical `hourOf` from `src/sim/engine.ts`.
- `WorldScene`: reads only `snapshot.world.tick` for target light. Creates one world-space `Rectangle` for ambient warm/cool grading, and **two raster textures** for emissive windows and streetlamps. Textures are generated on scene creation, not per frame/tick. No new Phaser light pipeline or physical shadows. Core lights are small, with layered low-alpha warm halos.
- One easing step uses render delta (clamped 0–100 ms) to converge on the latest authoritative snapshot. Rapid 20× changes retarget the same state; no accumulating tween objects. On pause/hidden, the visual controller freezes at canonical target; on reduced motion, transitions snap. Camera pan/zoom/fit/follow share map-space coordinates and remain unaffected by these noninteractive overlays.
- `windowLightsForWorld` maps existing cottage/longhouse/townhouse/farmhouse/workshop/trading-hall texture coordinates to each site instance. Last two use existing sign/awning glazing rather than inventing additional windows. `streetLightsForWorld` prefers main/plaza roads in 96×96; legacy 48×48 uses actual road terrain. It rejects occupied/entrance/POI tiles, enforces a six-tile Manhattan spacing and a cap of 32/72 lamps. Placement uses presentation `visualHash`, never `rngState`.
- Existing `LivingSnapshot.renderPaths`, scene selection, `GameCanvas`, `createClock`, `advanceOneTick` and `serializeSave` are unchanged. Scene shutdown destroys overlay/images/textures, with regenerated assets on restart.

## Hour samples

| Time | Phase | Ambient | Emissive |
|---|---|---|---|
| 06:00 | Dawn | soft amber after blue early morning | fading house/street light |
| 12:00 | Day | untinted full-color terrain | off |
| 18:00 | Dusk | warm orange glaze | progressively rising |
| 23:00 | Night | readable blue/cool tint (0.43 opacity, **not black**) | strong warm windows and streetlights |

Night covers 19:00–05:00; dawn 05:00–07:00; day 07:00–17:00; dusk 17:00–19:00. Neighboring interpolation samples are continuous across 23:00→00:00. Engine's `scheduledGoal(hour)` work 06:00–18:00, commons 18:00–20:00, home thereafter, remains completely unchanged.

## Verification & honest limitations

- Added pure Vitest suite `src/game/render/lighting.test.ts`: all 24 hours and quarter-hour samples, 04/05/06/07 and 16/17/18/19 boundaries, midnight wrap, finite/limited intensities, readable night alpha, 12:00 lights off, canonical tick/day rollover and bounded smoothing, seed-stable windows/lamps, actual road positions and six-tile spacing, v5/v6 `WorldState`/RNG/digest immutability.
- Run mandatory Fast CI (npm ci, production audit, typecheck, lint, Vitest including existing goldens and 720-hour matrices, build) on **final PR SHA**, and verify GitHub run `head_sha` before marking it PASS. CI result is in PR checks; **local execution unavailable because isolated runner has no npm/GitHub DNS**.
- Real browser screenshots at 06/12/18/23 × 48/96 × 1366×768, 1920×1080, 2560×1080: **NOT VERIFIED**. Physical local-PC FPS/GPU/heap, true 20× transition flicker, scene restart visual artifacts and actual accessibility experience: **NOT VERIFIED**. Consequently product/visual gate = **PARTIAL**, even if Fast CI passes. No E2E/Pages workflow dispatched.
- No shadow casting, power network, house occupancy awareness or free-running between-tick sky motion. GPU texture memory for the two RGBA 1152×1152 surfaces is approximately 10.1 MiB combined at 96×96 (estimated storage, **not measured**); needs actual GPU/texture observation before acceptance. A static shade plus emissive cues should improve legibility, but aesthetic quality cannot be certified without screenshots.

## Recommended optional visual QA

Use a debug/local fixture that displays the exact authoritative tick without mutating a saved game's gameplay history. Capture seed, tick, map schema, population, viewport, paused/observer setting and zoom. Check 06/12/18/23 with HUD hidden at Fit and zoom ≥2.4, then Follow/AFK, reset scene and alternate 1×/5×/20×/Observer pacing. Inspect Windows GPU performance on 96×96/100 NPC. Do **not** dispatch manual CI workflows without owner request.
