# V01-B — Responsive Camera & Controls | Technical decision

**Date:** 2026-10-15  
**Branch:** `feat/v01-b-responsive-camera` → [PR #12](https://github.com/giabao2605/Tiny-Civilization/pull/12)  
**Base:** `main@c00186a2` (V01-A merged in #11; post-merge [CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38694131757)).  
**Status:** Implementation committed; acceptance **PARTIAL until branch CI and screenshots are validated**. No auto-merge.

## Scope

- Actual Phaser backing framebuffer uses the `canvas-host` CSS pixel dimensions; `ResizeObserver` calls `game.scale.resize` only when integer dimensions change, then restores the old camera world focus or refits according to the selected mode. One Phaser instance per mounted component.
- `WorldScene implements WorldCameraControls`. `GameCanvas` passes a scoped handle on Scene CREATE and null on React teardown; controls check the current instance and inactive scenes reject actions. No global singleton, no React access to Phaser internals.
- **Fit**: exact current tile footprint 48×48×12 = 576²; zoom = `min(width/576,height/576)` clamped to [0.1,3]. Fit centers the map; unoccupied viewport bars are dark background, not fabricated terrain.
- **Reset**: centered map at `min(3, fit×1.15)`, deliberately a little closer than overview. Independent of the **Khởi tạo lại canvas** lifecycle stress button and the **Tạo lại** seed control.
- **Manual**: wheel zoom about hovered screen point; drag after >5 screen px; clamp world-view center within the map. If world is smaller than viewport, center it instead of allowing endless empty pan.
- Accessible buttons for Fit, Reset, ± zoom, focus styles and F/R keyboard shortcuts. Text readout reflects mode, zoom and live viewport. Mouse actions switch to `manual`.
- Responsive PC shell unlimits the old 576px map host and 1480px shell. 390px viewport still has no horizontal scrolling.
- Pixel sampling stays nearest-neighbor (`pixelArt: true`, `antialias: false`, `image-rendering: pixelated`). At fractional zoom, nearest-neighbor produces uneven pixel widths; intentionally no vector smoothing or distortion.

## Isolation and lifecycle

No changes to `src/sim`, `src/persistence`, WorldState schema v5 or the 48×48 map. Camera actions only modify Phaser camera presentation, not NPC tile, world tick, PRNG or save output. When seed/population/load triggers scene restart/remount, camera resets to its documented default and old controls are detached. Resize preserves current selected NPC, simulation and canonical save data.

## Evidence and tests

- Pure geometry tests: `src/game/camera/cameraMath.test.ts`.
- Browser: `tests/e2e/observer-v01-b.spec.ts` covers 1366×768, 1920×1080, 2560×1080, 390×844 at seed 12345 with pause, Fit/Reset, bounded camera motion, cursor-anchored wheel, NPC selection, save stability, 20/50/100 population, remount and screenshots.
- Browser performance: `tests/e2e/observer-v01-b-perf.spec.ts` samples RAF intervals (frame p95 and mean FPS) at 20/100 NPC and 1×/20× on the **CI Chromium runner only**. This is *not* a device benchmark or FPS guarantee.
- Historical V01-A baseline spec preserved literally as `tests/e2e/baselines/observer-v01-a.before.ts.txt`. Its assertion requiring exactly 576² is obsolete after this upgrade, so it is archived rather than falsifying the original before-data. Previous evidence remains in [V01-A artifact 11952312979](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38692235689/artifacts/11952312979).
- New browser artifacts are copied to `observer-v01-b-evidence` *before* the production Playwright pass wipes `test-results/`. A GitHub Actions PASS only proves the test environment; visual screenshots must still be inspected.

## Baseline comparison

V01-A recorded fixed **576×576 internal and CSS** across 1366/1920/2560. V01-B checks real camera/canvas dimensions for each desktop width and captures screenshots with seed/tick/viewport/zoom metadata. Exact post-change numbers and visual judgement must come from the passing PR's artifact, not speculation.

## Limits, risks, rollback

- G0/T06-A including novice-player/physical-PC FPS remains **PARTIAL**, separately tracked. Browser measurement does not sign it off.
- Larger world maps are **not implemented** here; a later Plan 02 must derive renderer dimensions from world metadata, not assume new maps already exist.
- Webcam/multi-input/mobile landscape and device pixel ratios other than CI defaults remain unverified. The canvas is rendered in CSS pixel units (DPR can affect final display of nearest-neighbor pixels).
- Follow camera, weather, pathfinding, art kit, audio and schema migration explicitly out of scope.
- Roll back the camera files, UI, CSS, and V01-B tests as one isolated PR; save schema requires no migration.

## Handoff to V01-C

Only begin V01-C after this PR is reviewed, CI/screenshot evidence is satisfactory, and separately approved to merge. V01-C should follow `ART_BIBLE.md` for terrain/house/NPC silhouette improvements. Use the V01-B resized framebuffer and typed camera API as the renderer baseline; do not use world simulation PRNG for decorative variations. G0/T06-A remains an independently open gate.
