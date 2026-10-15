# V01-A → V01-B handoff | Responsive Camera & Controls

**Repository:** https://github.com/giabao2605/Tiny-Civilization  
**Source baseline:** `main@e7d0b943b094e4d93566077396ae9c4de26f398b` and V01-A PR branch `audit/v01-a-visual-baseline`.  
**Read in a NEW task:** `README.md`, `docs/PROGRESS.md`, `docs/SIMULATION_CONTRACT.md`, Observer `README.md`, `MASTER_PLAN.md`, `plans/01_VISUAL_DIRECTION_AND_CAMERA.md`, `V01_A_AUDIT.md`, `ART_BIBLE.md`, `V01_A_STATUS.md` and current source/tests. Confirm V01-A has been reviewed/merged before coding V01-B. Do not copy stale code or rely on earlier chat.

## 0. Gate

**DO NOT start V01-B implementation until V01-A evidence is reviewed and accepted.** V01-A does not imply that G0/T06-A is globally complete. Verify current main/CI and browser screenshot artifacts, especially screenshot readability and 576-px host cap. If missing, first report blocker; do not silently turn V01-B into a giant art/map/simulation PR.

## 1. Single-task objective

V01-B only: make the camera+map viewport responsive on PC and expose a safe runtime-controlled **Manual/Fit/Reset** (and explicit wheel/drag) UI while keeping NPC selection, ongoing simulation and screen pixel sharpness intact. Fit should view the whole existing 48×48 world, Reset should restore a documented initial view, and resizing should preserve a valid camera/selected NPC, not instantiate duplicate games. Follow/AFK, new art, new tile/map sizes and day/night belong to later tasks.

## 2. Confirm source-level baseline

- `src/sim/grid.ts`: 48×48×12 = 576×576 logical world footprint.
- `src/game/createGame.ts`: currently creates a 576×576 Phaser game with AUTO/pixelArt/antialias:false and returns `{game,scene}`.
- `src/game/scenes/WorldScene.ts`: already performs `setBounds`, `centerOn`, wheel zoom clamped 1–3, scroll pan on pointer movement after 5px drag, select closest rendered living NPC within 9 world px, render tweens and scene restarts.
- `src/game/GameCanvas.tsx`: dynamically imports/creates a single game in useEffect, calls `scene.setSnapshot`; destroys and clears DOM on unmount. No host size observer.
- `src/app/App.tsx`: owns `canvasVersion`, selected NPC dispatch, map section, `Khởi tạo lại canvas` button, pause/seed/save. Do not repurpose reset-canvas as reset-camera.
- `src/styles/app.css`: max shell 1480, 355 sidebar and `.canvas-host {width:min(100%,576px);aspect-ratio:1/1}`; forced CSS scaling of fixed backing canvas.
- Existing Playwright: `tests/e2e/smoke.spec.ts` verifies wheel, drag, canvas selection, remount and pause; `tests/e2e/release.spec.ts` checks Pages production; `tests/e2e/observer-v01-a.spec.ts` captures V01-A pre-change images. **Preserve this baseline test or explicitly version it as “before” when adding after tests.**

## 3. Suggested API and ownership boundaries

Create an adapter/API under `src/game/camera/` with a small **typed public contract**, not a React component reaching into `scene.cameras.main` or a global singleton:

```ts
export type CameraMode = 'manual' | 'fit' | 'reset';
export type CameraSnapshot = Readonly<{
  mode: CameraMode;
  zoom: number;
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
}>;
export interface WorldCameraControls {
  fit(): void;
  reset(): void;
  zoomBy(factor: number, screenPoint?: { x: number; y: number }): void;
  getCameraSnapshot(): CameraSnapshot;
}
```

**Interface is a proposal, not yet code.** Implement camera methods as a scoped interface on the live WorldScene or a delegated controller. Expose it from `createGame` through a lifecycle-safe handle to `GameCanvas`. The React toolbar should call controls only when ready (disable or defer until initialized) and unsubscribe on unmount. If `GameCanvas` remounts or dynamic import resolves after unmount, stale controls must not operate on a destroyed game. Prefer `onCameraReady(controls|null)` or an imperative ref with appropriate cleanup, with one source of truth and no duplicate registration.

**Modes semantics:**
- **Manual:** existing mouse wheel/drag; any manual action explicitly exits Fit and (in future) Follow/AFK. Canvas click on a citizen continues to dispatch `select-citizen`.
- **Fit:** calculate zoom from **actual rendered viewport** and **actual world pixel bounds**: `min(viewportW/worldW, viewportH/worldH)`, constrained by a documented minimum/maximum. Center world, clamp pan, handle empty bars/background without exposing simulated tiles outside bounds as content. On later 96×96, world size comes from world metadata when available (do not implement migration in V01-B).
- **Reset:** restore documented initial center/zoom consistent with current world and viewport. Crucially, avoid using `game.destroy`/scene restart as a camera reset.
- **Wheel:** zoom around the hovered point where feasible. Let world coordinate under cursor before/after zoom differ only because of clamping at edges; prevent browser page scroll while wheel zoom is intentionally handled (test it).
- **Drag:** preserve >5 CSS/screen px threshold and no subsequent click if dragged; respect Phaser's pointer coordinates, CSS backing resolution and DPR.
- **Resize:** preserve camera focus/world point and selection when possible. Keep bounds valid and avoid “void”, jump or extra tick. Resize from actual host dimensions, not hardcoded window.width; account for collapsible sidebar and shell.

**Design decision to resolve during V01-B:** Phaser canvas backing resolution vs CSS size. It is currently 576×576 stretched/downscaled by CSS. Choose either responsive Phaser `Scale.RESIZE`/explicit `game.scale.resize` or a logical-resolution letterbox model, after measuring host pixels; document pixel crispness at fractional device pixel ratios. Do not blindly increase the render canvas to 2k×2k without profiling. Avoid `ResizeObserver` loops by checking dimension changes before calling Phaser resize; disconnect on teardown.

## 4. Expected changed files (narrow scope)

| File | Expected change | Must preserve |
| --- | --- | --- |
| `src/game/scenes/WorldScene.ts` | camera operations, minimum safe bounds, anchored zoom, screen/world-coordinate fixes, event handling | render/tween logic, ID click selection and read-only WorldState |
| `src/game/createGame.ts` | take measured viewport host dimensions, expose controller via return object or forwarding adapter; adapt Phaser scale if chosen | one Phaser instance, type AUTO, pixelArt, no sim module mutations |
| `src/game/GameCanvas.tsx` | measured host resize with observer; lifecycle-safe camera controls handoff/cleanup | dynamic import cancellation guard, snapshot forwarding, destroy(true), StrictMode safety |
| `src/app/App.tsx` | accessible Fit/Reset buttons and keyboard shortcuts (optional explicit zoom +/−); state display if useful | existing reset canvas/seed/pause/selection/inspector, save controls |
| `src/styles/app.css` | enlarge effective map area on desktop and responsive frame, maintain HUD legibility and no horizontal overflow | keyboard focus styles, mobile 390px layout |
| `src/game/camera/*` (new, optional) | small typed UI-owned adapter / helpers with deterministic mathematical camera bounds calculations | no dependency on `src/sim/engine.ts` decisions or RNG |
| `tests/e2e/observer-v01-b.spec.ts` (new) | reproducible camera actions/resize/selection and screenshots after change | existing test suites untouched |
| Observer docs `V01_B_*.md` (new) | ADR of chosen resize/fit policy, evidence, rollback | no edits to legacy Phase 00–08 documentation |

No edit to `src/sim/engine.ts`, `world.ts`, `pathfinding.ts`, `economy.ts`, `social.ts`, `governance.ts`, `persistence/save.ts` or schema v5 for this task.

## 5. Explicit tests and observation matrix

**Precondition:** `npm ci`, Node 22.x/npm 10, Chromium Playwright installed; test against the V01-B branch. Use seed **12345**, pause to freeze simulation, record actual tick and resolution in each screenshot.

| Scenario | Automated assertion / evidence |
| --- | --- |
| New instance & unmount | exactly one canvas after mount, no duplicates after 3× canvas reset; no page errors |
| Fit 1366×768 | fit places all four world corners inside camera viewport, no black void falsely rendered as map, selection remains |
| Fit 1920×1080 | actual map viewport wider than old 576 CSS px when layout permits; screenshot and measured DOM canvas box |
| Fit 2560×1080 | usable ultrawide composition with world not stranded in a 576px island; no horizontal overflow |
| Reset | returns to documented center & nominal zoom after wheel/pan; no scene reset or extra NPC |
| Wheel | zoom-in/out clamps stable; world point under pointer remains within tolerance away from boundaries; page does not scroll unexpectedly |
| Drag | movement >5 px pans when zoom permits and never chooses NPC; ≤5 px click remains selectable; selection by list still works |
| Resize | 1366→1920→1366 while Fit/Manual; camera bounds valid, NPC selection persists, no duplicate game |
| Pause/resume | idle camera controls while paused do not change tick/digest; resumed NPC tweens still move appropriately |
| World lifecycle | seed reset/load/new population 20→100 when paused or running does not throw or leave stale camera handles |
| Save | loaded v5 world unaffected by camera changes; localStorage/JSON payload and engine digest remain equal at same tick |
| Responsive HUD | screenshot full page+canvas at each viewport, contrast/legibility; 390px mobile smoke without overflow |
| Performance | record FPS/frame p95 for 20/100 NPC at 1× and 20× if runner available; compare same runner/conditions to V01-A |

Do not test internals only: use observable UI actions, viewport coordinates and screenshot/geometry. Make any debug camera exposure dev-only and noncanonical; avoid brittle assertions on exact raster image bytes from GPU.

**Quality commands:** `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`. Report actual PASS/FAIL/NOT RUN per environment; distinguish CI from local runs and attach workflow URLs/artifacts.

## 6. Acceptance / exit checklist

- [ ] V01-A approval and G0 dependencies clarified.
- [ ] Fit, Reset, Manual pan/zoom accessible through safe camera interface and toolbar.
- [ ] Real resized viewport on 1366/1920/2560 with no fixed 576px cap and no void beyond bounds.
- [ ] Camera input works with existing NPC click/inspector and pause/seed/save.
- [ ] No stateDigest changes caused by UI camera operations; no new random draws, no tick from camera.
- [ ] Render retains nearest-neighbor aesthetic at close and distant zoom, and no unreadable HUD overlaps.
- [ ] Playwright matrix and screenshots recorded; typecheck/lint/unit/build/E2E pass on final commit.
- [ ] Scoped PR against up-to-date `main`, reviewed but **NOT merged automatically**.

If any gate cannot be verified, report **PARTIAL/BLOCKED** with the exact missing evidence. Do not claim 60 FPS without measurements.

## 7. Risks, mitigations and rollback

- **Resize/canvas coordinates:** camera scroll may be measured in logical pixels while pointer CSS geometry changes. Fix conversion with Phaser scale manager; test pixel-point targeting.
- **Zoom smaller than world fit:** map empty margins on panoramic view are acceptable if visually intentional; never show fake traversable land beyond real world bounds.
- **Camera bounds after resize:** Phaser camera clamp if world smaller than viewport requires explicit centering; do not use negative scroll as simulated map contents.
- **Reset and snapshot races:** `scene.restart()` currently on population changes, seed/backward tick. Unregister old handlers/ref; restore safe camera mode after scene active.
- **Runtime scaling cost:** increasing backing resolution can increase fill/fragment cost, notably with many Graphics/Text objects. Measure and avoid per-frame allocations.
- **Accessibility:** button keyboard operation, focus ring, reduced motion, no forced follow/AFK.
- **Rollback:** revert only camera adapter, UI controls, CSS and new tests to restore prior 576px scene; v5 saves do not need migration.

## 8. Copy-paste task for V01-B

> Implement **V01-B Responsive Camera & Controls only** in `giabao2605/Tiny-Civilization`. First inspect main, CI, all Observer master/Plan 01 documents and V01-A audit/art bible/status/handoff; do not start until V01-A is accepted with evidence. Preserve existing wheel, drag, click-to-select, tween, seeded determinism, 1 tick=1 game-hour, NPC goals/routing, economy/social/households/governance, and v5 save/load. No new world size, art assets, Follow/AFK, weather, backend or Phaser rewrite. Branch from main; implement typed camera-control API, real responsive Phaser viewport, Fit/Reset and anchored wheel zoom. Add Playwright camera matrix for 1366×768, 1920×1080, 2560×1080 plus 390px, seed 12345, pause/resize/selection/remount/save; capture evidence. Run npm ci/typecheck/lint/test/build/test:e2e, report actual status and CI, make focused PR, **do not merge**.
