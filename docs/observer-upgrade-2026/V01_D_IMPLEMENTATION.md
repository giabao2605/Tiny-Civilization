# V01-D — Follow Camera & Cinematic AFK

**Date:** 2026-10-16
**Branch:** `feat/v01-d-follow-afk`
**Base:** V01-C merge `a0cddcc2108d0e25ba1455b972f673b7a284b3b6`
**Status:** PARTIAL pending full post-PR CI, visual evidence inspection and comparative measurements.

## Architecture

- `WorldScene` remains the only camera-mode authority; `CameraSnapshot` reflects `manual / fit / reset / follow / afk`. No new Phaser instance, tick event or save property.
- Follow resolves the currently living NPC through its actual moving Phaser container. Frame-based bounded exponential smoothing follows the tween even at skipped 20× UI snapshots, with 48×48 map clamp; idle sprites remain stationary.
- AFK is opt-in OFF by default. Idle time is actual browser `performance.now()`, independent of simulation ticks. Choices come from real selected/moving citizens, commons, market, work sites, and referenced nodes/events; stable ordering, no random draws. Shots rotate no faster than 9 seconds, avoid immediately reusing one interest and smoothly transition on each frame.
- Camera snapshot updates are throttled to ~900ms during movement to reduce whole-React-tree re-renders; explicit mode changes still announce immediately.
- Canvas drag, wheel, Fit, Reset and manual zoom cancel both auto modes and disable AFK. Other input exits a running AFK sequence but retains the explicit AFK-enabled preference until the next full idle timeout.
- Tab hidden exits AFK and resets idle clock; reduced-motion users cannot start AFK, and Follow snaps rather than gliding. All global/scene listeners cleaned up at unmount or scene shutdown.
- Camera mode/configuration is ephemeral React/Phaser runtime. Reset world/save/load/canvas remount creates fresh controls; no mutation of simulation state.

## Verification

- Unit: `src/game/camera/afkDirector.test.ts` covers world-backed interest ordering, dead targets, idle, reduction and interpolation.
- E2E: `tests/e2e/observer-v01-d.spec.ts` covers A/B follow, override, pause, AFK idle and input exit, reduced motion, remount and viewport screenshots (Chromium).
- CI workflow preserves V01-D evidence separately from production smoke. V01-D performance spec pairs manual/Follow captures for 20/100 NPC × 1×/20× on the *same Chromium runner*, with FPS, p50/p95, heap, canvas count. Previous V01-C evidence remains the historical reference; physical-PC performance is a separate gate.
- These are *intended test cases*, not claims that npm commands, screenshots or performance passed locally. GitHub connector environment does not provide a local repo/Node/browser test runner.
- **Open gates:** actual visual review (particularly AFK scene transition and NPC at map edges), final PR CI status, physical-PC FPS at 20/100 × 1×/20×, and long-run memory/watchdog. Do not mark DONE solely on source delivery.

## Rollback

Revert this camera-only PR. Renderer/simulation/world save schema require no migration. Next work item: V01-E scene/art polish after gates are reviewed.
