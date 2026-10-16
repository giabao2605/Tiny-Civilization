# V01-E — Visual & Performance Polish: implementation

**Date:** 2026-10-16 · **PR:** [#15](https://github.com/giabao2605/Tiny-Civilization/pull/15) · **Base:** `main@8d639c4a` (V01-D merged).
**Status:** implementation verified by CI, **acceptance PARTIAL** because hardware/soak/performance gates remain open. No automatic merge.

## Scope and findings

This slice addresses the existing 48×48 Phaser observer, **not** gameplay, map expansion, weather, districts, pathfinding, clock or save changes. Main was verified at `8d639c4a`; post-merge V01-D runs [38846060402](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38846060402) and [38846060327](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38846060327) both succeeded (96 unit / 22 E2E / 1 skipped, production smoke).

Code audit showed: V01-C already bakes terrain into one texture and reuses the art kit; no need to rewrite it or add culling. However, selected-NPC highlight geometry was cleared/redrawn per frame, construction progress bars were redrawn without content changes, AFK sorted POIs every frame, map drag broadcast camera state on every pointer move, and resource/construction bars were depth=1200 regardless of floor row. Small ID labels were visually noisy in overview.

## Changes shipped on this branch

- `src/game/scenes/WorldScene.ts`: selected ring/arrow draw once in local coordinates; only update transform and visibility. Construction markers now key on position/progress/hoursRequired and skip duplicate drawing. AFK interest list is computed only when shot rotates or target becomes invalid; reuse the active media query to avoid per-frame `matchMedia` allocation. Throttle drag camera-to-React broadcasts to ~150 ms, force final broadcast at pointer-up. Place resource/construction indicators beneath citizens at floor depth. Citizen ID badges hidden at Fit/overview (camera zoom <2.4), shown in close-up; selection ring remains independent. All listener/AFK timer/tween cleanup preserved.
- `src/game/createGame.ts` and `GameCanvas.tsx`: optional `?observerPerf=1` DEV-only scene/texture/object diagnostics, and dispose diagnostic closure on Phaser remount. This is not a save or engine field.
- `tests/e2e/observer-v01-e-perf.spec.ts`: 54-condition Chromium matrix (20/50/100 NPC, 1×/20×, 1366/1920/2560, Fit/manual-close/Follow) and six remount count/invariant checks. 480-ms samples capture rAF mean FPS, frame p50/p95, CDP JS heap, canvas/object/texture count, zoom and tick.
- `tests/e2e/observer-v01-e-visual.spec.ts`: paused/selection, close-up and overview screenshots, AFK two genuine POIs, nearest-*living*-resident-to-each-edge Follow screenshots and clamp checks.
- `.github/workflows/ci.yml`: retain V01-E PNG/JSON artifacts and serialize heavy CI jobs on the same PR ref using concurrency cancellation.
- `scripts/observer-benchmark.ps1`: optional headed local Chromium matrix; does **not** certify hardware FPS on its own.

**Tested and rejected:** an 8-outfit shared-texture `citizenArt.ts` variant. The intermediate measurement did **not** show a reliable improvement across the matrix and it added texture churn/complexity. It was removed from the final code rather than being labeled an optimization. Intermediate workflow failures included a strict TypeScript tuple issue (fixed), and transient overloaded 100-NPC Playwright smoke timeouts. The exact code HEAD `c1db2c13` later achieved clean CI ([38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446)).

## Boundaries, rollback and outstanding concerns

The diff does **not** change `src/sim/**`, coordinator/engine rules, `WorldState`, save parser/serializer or tick speed. Camera state remains runtime-only. Revert PR #15 to restore V01-D display; no migration. Phaser still uses per-citizen Graphics, Text and Container as in V01-D: those are known costs at 100 NPC and should be revisited only with a controlled profiling pass. The HUD is also driven by full `WorldState` snapshots; avoid attributing every 20× performance issue to the camera alone.

See [performance](V01_E_PERFORMANCE.md), [QA](V01_E_QA.md), and [handoff](V01_E_HANDOFF.md). Performance gains were **not** established consistently on the headless runner and physical PC / 60–120 min soak remain open.