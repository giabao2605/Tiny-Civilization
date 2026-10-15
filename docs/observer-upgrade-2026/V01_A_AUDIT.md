# V01-A | Baseline & Visual Audit (source-grounded)

**Task:** V01-A only. **Date:** 2026-10-15. **Base:** `main@e7d0b943b094e4d93566077396ae9c4de26f398b` (merged PR #10). **Scope:** audit, acceptance baseline, art direction, V01-B handoff, and evidence-only Playwright capture. **No renderer, camera, simulation, save or game behavior changes.**

## 1. Evidence and reliability

- Read: root `README.md`, `docs/PROGRESS.md`, `docs/SIMULATION_CONTRACT.md`, Observer README/Master/Plan 01/Research Source, `WorldScene.ts`, `createGame.ts`, `GameCanvas.tsx`, `App.tsx`, `app.css`, `grid.ts`, `world.ts`, Playwright config, `smoke.spec.ts`, `release.spec.ts`, package scripts, CI workflow.
- **Observed directly in GitHub source:** implementation details in tables below. **Do not mistake these code observations for a browser visual test.**
- **External codebase baseline:** GitHub Actions [main CI run 38690161727](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38690161727), commit `e7d0b943`, concluded success for npm ci, security audit, typecheck, lint, Vitest, build, Chromium Playwright, Pages build and production smoke. [Pages run 38690161742](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38690161742) succeeded. These are **main** runs, NOT claims of executing local commands or new branch tests.
- **Local limitation:** container is Node 22.16.0/npm 10.9.2; `git clone --depth 1 --branch main https://github.com/giabao2605/Tiny-Civilization.git` failed with `Could not resolve host: github.com`. No local checkout or installed dependencies. Consequently `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` on the V01-A branch were **NOT RUN locally**. CI runs can be independently verified after PR creation.
- **G0/T06-A:** global baseline is PARTIAL/UNVERIFIED. The present work establishes only V01-A's focused baseline, not migration proof, performance gate, physical device FPS, or all G0 acceptance.

## 2. Implementation inventory

| File, entry point | What exists | Limitation / V01 target |
| --- | --- | --- |
| `src/sim/grid.ts` | GRID_WIDTH/HEIGHT = 48; TILE_PIXELS = 12; world footprint = **576×576 logical pixels**, 2,304 cells | Global geometry not ready for mixed 48/96 world sizes. Do not change this in V01-A/B. |
| `src/game/createGame.ts:createGame` | Phaser.AUTO, fixed game size 576×576, `render.pixelArt=true`, `antialias=false`, background `#294835`; instantiates WorldScene | Fixed internal canvas size, no Phaser scale mode/responsive resize contract, no camera command handle. |
| `src/game/GameCanvas.tsx` | React host ref; schedules dynamic import after rAF; forwards snapshots to scene; destroys Phaser with `game.destroy(true)` and clears host on unmount; async guard handles StrictMode races | No ResizeObserver, no handling of host dimensions/DPR, no camera controller passed to HUD. Canvas remount is triggered via React key. |
| `src/app/App.tsx` | Coordinator owns world; starts seed 12345 / 20 NPC; HUD controls pause, 1×/5×/20×, seed/reset, list selection, saving; `GameCanvas key={canvasVersion}`; reset-canvas button | HUD has only textual wheel/drag hints and reset **canvas** (not reset camera); no Fit/Overview/Reset-camera/Follow controls. Sidebar competes with map width. |
| `src/styles/app.css:43-53,108-123` | `.site-shell max-width:1480px`; workspace `1fr 355px` sidebar; centered frame; `.canvas-host {width:min(100%,576px);aspect-ratio:1/1;overflow:hidden}`; canvas CSS width/height forced 100%, `image-rendering:pixelated`; responsive breakpoints 980/620px | On wide desktop the map remains at most **576 CSS px**, regardless of free horizontal space. CSS scales the Phaser backing buffer without resizing its camera. Ultrawide gains margins, not world area. |
| `WorldScene.create` | camera bounds to 576×576, starts centered at `xPixel(24), yPixel(24)`; terrain, sites, construction, resources, citizens, highlight; registers pointer listeners and removes on SHUTDOWN | Viewport and bounds are hardcoded to current grid; scene restart resets visual camera. |
| `WorldScene.onDown/onMove/onUp/onWheel` | Pointer drag pan after Euclidean movement >5 screen px; camera scroll deltas divided by zoom; click picks nearest **visible** citizen container within 9 world px; wheel zoom multiplies 1.14/0.88 and clamps to 1…3 | No pointer-anchored zoom; no explicit keyboard, fit/reset/follow, UI state API. Minimum zoom 1 prevents fitted overview for a camera viewport smaller than 576. No automated verification of pan/zoom bounds at mixed aspect ratios yet. |
| `WorldScene.setSnapshot` | Receives new WorldState read-only as a snapshot; tweens citizens along `lastMove`, scaled by speed; pauses/resumes tweens; stops dead sprites; snaps if intermediate ticks skipped; scene.restart on seed/count/backwards-tick | Restart discards camera intent/selection visuals until snapshot repaint; snapshot-only new citizens rely on restart. No animation budget or pooled animated assets beyond existing maps. |
| `WorldScene.update/redrawHighlight` | Highlights selected sprite at depth 30; redraw each frame when selected | Graphics clear/draw each frame is a profiling candidate, not a proven bottleneck. |

**Selection source of truth:** `LivingSnapshot.selectedCitizenId` is owned by the app/coordinator. Phaser invokes only `onCitizenSelected(id)`; the scene must not directly mutate citizen data. The click target is a proximity search over rendered containers, not a Phaser physics/input hitbox.

## 3. Render path and depth map (actual source)

| World content | Current technique | Depth | Visual/readability implication |
| --- | --- | --- | --- |
| grass, water, forest, roads, grid | `paintTerrain()`: one Phaser Graphics object with 2,304 tile fillRects + forest rectangles and occasional water line; deterministic `(x*17+y*29)%7`, unseeded but stable | 0 | Small uniform rect palette; forests blend with ground; grid lines across every tile; no texture/shore/road junction rules. |
| home/work/market/commons | `paintSite()`: one Graphics object **per site**; rectangles, triangles, circles | 3 | One silhouette per site kind, all homes appear near-identical; roofs are icon-like 12 px illustrations. |
| field/forest stocks | `paintResource()`: one mutable Graphics per node; cleared/repainted when stock changes | 6 | 10×4 bars compete with terrain and NPC; forest marker ambiguity possible. |
| construction | `paintConstructions()`: mutable Graphics per active construction, destroyed when inactive | 8 | Overlay may visually compete with adjacent people. |
| citizens | `paintCitizen()`: a container, procedural Graphics body/head/shadow + per-NPC Phaser Text label; color from appearance | 15 | Every NPC stacks at same fixed depth, not Y-sorted. Sprites drawn on top of roofs/trees irrespective of relative row; dense labels can overlap. |
| selection | one Graphics cleared/redrawn per selected frame | 30 | Strong contrast currently, but selected marker can overlap others; hide if selected sprite invisible is not checked in redraw. |

**Occlusion diagnosis (code-level):** fixed depth 15 above all houses/forests means no physically coherent back-of-building occlusion; forest foliage is painted into depth-0 background. NPCs cannot visually pass *behind* upper canopies at current layer boundaries. Whether the resulting screenshots are objectionable requires visual review of CI artifacts.

**Object lifecycle:** terrain one Graphics drawn once per scene; site Graphics created at startup and only newly appended sites drawn on later ticks; resource/construction Graphics reused; citizens are per-ID containers with text; movement tweens replaced/stopped on new tick and on death; scene restart reconstructs everything, shutdown removes scene-local pointer listeners/maps, React unmount destroys entire game. Object count and draw calls must be **measured**, not inferred from this inventory.

## 4. Issue register / targeted solutions

| ID | Severity | Concrete cause and user impact | Proposed fix & owner |
| --- | --- | --- | --- |
| VIS-01 | P1 | `app.css:51` caps visible world at 576 px, even on 1920/2560 displays; workspace reserves 355 px sidebar. Map occupies too little PC screen. | V01-B use measured host and Phaser resize/fit with an explicit map viewport; responsive layout constraints, no CSS-only fake zoom. |
| CAM-01 | P1 | `createGame.ts` fixed size and `WorldScene.create` fixed center/bounds; no fit or reset; wheel clamp 1…3 ignores viewport fit. | V01-B camera API + resize owner + world-bounds-based fit; preserve current pan/wheel. |
| CAM-02 | P2 | `onWheel` zooms around camera center, not pointer; `onMove` suppresses click after 5px drag but screen/world conversion depends on Phaser scale. | V01-B pointer-anchored zoom + Playwright input/resize regressions. |
| ART-01 | P1 | `paintSite()` has just one drawing per kind, including a single home roof. Repetition weakens village identity. | V01-C 6 deterministic silhouettes by site ID/seed; distinct doors/entrances and shadows. |
| ART-02 | P1 | `paintTerrain()` uses two grass shades and tiny forest decals with no edge/autotile; hard road/grass boundaries. | V01-C data-driven palette, tile-neighbor edge kit, 3 foliage variants and roads/path layering that **does not change routing**. |
| ART-03 | P2 | Static depths (0/3/6/8/15/30); no Y-based occlusion; NPCs render above every building. | V01-C/E anchor/depth contract and partial foreground sprites, preserving selection hit targets. |
| ART-04 | P2 | 6px per-NPC text and 12px logical cells make crowd details noisy at overview. | V01-C/E readability tests for 20/50/100 and fade/limit labels by zoom, with inspector always available. |
| PERF-01 | P1 risk | One Graphics per site, Text per NPC, highlight redraw each frame; no source-level FPS guarantee. Prior Phase 06 CI browser sample ~25 FPS at 100 NPC/20×. | V01-E profile and cache/batch; V01-A records baseline evidence and honest limitations only. |
| QA-01 | P1 | Existing e2e wheel/drag/remount smoke, but no 3-desktop-viewport baseline artifact tied to seed/tick for Observer upgrade. | V01-A adds `tests/e2e/observer-v01-a.spec.ts` as repeatable screenshot and canvas-geometry capture. |
| QA-02 | P2 | Asset/draw-call and pixel overlap not accessible via static reading; browser screenshot review not yet substantiated. | Inspect artifact image+metadata manually and add dev-only counters in later scoped work, never assert guesses as measurements. |

## 5. Evidence protocol

The added Playwright test uses seed **12345**, immediately pauses, records the **actual tick**, and produces baseline screenshots at **1366×768**, **1920×1080** and **2560×1080**. Also takes 1366×768 images after wheel zoom-in and after drag, records canvas intrinsic dimensions/CSS dimensions/document width in JSON, then smoke-checks single-canvas remount and no browser page errors. It does **not** claim that the scene reached tick 0 exactly, that full-page screenshots represent camera pixel ratios exactly, or that it measured FPS/draw calls.

Outputs are under Playwright `test-results/` and included in CI's `phase-07-release-evidence` artifact (`upload-artifact if: always`). CI success proves automated assertions passed; **visual quality still requires human review of screenshot artifact**. No approval of V01-B should depend on an imagined screenshot.

## 6. Acceptance state as of this audit

- V01-A source audit: **DONE (code evidence)**.
- Art Bible: see [ART_BIBLE.md](ART_BIBLE.md).
- CI main baseline: **PASS (run 38690161727; not V01-A branch)**.
- V01-A screenshot acquisition/review: **pending branch CI artifacts** at drafting time; update [V01_A_STATUS.md](V01_A_STATUS.md) after verification.
- PC local smoke, FPS, GPU draws, cross-resolution readability judgment: **NOT RUN/UNVERIFIED** from this workspace.
- G0/T06-A globally: **NOT VERIFIED**. No V01-B/C/D/E code delivered here.

## 7. Rollback

Revert this V01-A branch's observer-doc files and `tests/e2e/observer-v01-a.spec.ts`. No production game behavior, WorldState, save format or legacy phase documents are modified.

## 8. Actual browser artifact review (limited; not the complete V01-A matrix)

On 2026-10-15, downloaded and visually inspected **actual Chromium production smoke screenshots** from [PR CI run 38691591882](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38691591882), artifact [11952801229](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38691591882/artifacts/11952801229), files `phase-07-production-1366.png` and `phase-07-production-1920.png`. These are **real rendered images**, distinct from source-only hypotheses. Important: production smoke changes population/tick between captures; the two images are **NOT** a controlled same-tick/same-population before/after comparison, and neither is a V01-A zoom-extreme screenshot.

Observed:
1. At 1366px width, the usable settlement render is visually a centered ~576px square within a much wider map panel. The map extends below the initial 768px-high first fold because the top hero/header and panel consume substantial vertical space. **Confirms VIS-01 from actual screenshot.**
2. At 1920px width, the overall site is centered with large side margins due to `max-width:1480px`, while the Phaser game area does not fill the available map panel; world size still reads as a small island, not a broad observation surface. **Confirms the UI composition problem**, not merely an assumption about CSS.
3. At both resolutions, homes are near-identical little peaked-roof marks, tightly constrained to one tile. Roads appear as broad straight tan strips and right-angle junctions. Forests repeat small square clusters on almost every dark-green tile. This **confirms low silhouette and texture variety** in the existing renderer.
4. At the 100-NPC 1920 capture, a dense group near the commons/roads exhibits compact number tags and almost identical vertical character silhouettes; several tags visually crowd the same area. Identity and activity are difficult to distinguish without the inspector. **Confirms ART-04 in the observed 100-NPC case**.
5. The screenshots do **not** prove dynamic occlusion defects, precise input anchoring, frame times, or zoom behavior. Those remain code-level findings or pending browser captures.

**Evidence pipeline issue identified and fixed in this PR:** GitHub CI runs all E2E first but then runs the production Playwright smoke test, which cleans `test-results/` before upload. The initially downloaded artifact contained only 3 production screenshots and no `v01-a-*` files despite successful first-run E2E. The CI workflow now stages `v01-a-*` files to `observer-v01-a-evidence/` **before** production smoke and includes that directory in the artifact. This fix must pass a new CI run and its images must be inspected; do not count the original smoke screenshots as all three controlled baseline captures.
