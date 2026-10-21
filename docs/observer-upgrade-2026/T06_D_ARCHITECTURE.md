# T06-D — Architecture and lightweight renderer optimization

WorldScene is presentation-only. The authoritative world is owned by the coordinator and advanced by the simulation engine; culling may never influence routing, NPC life, weather RNG or serialized saves.

Existing render architecture already generates static terrain and road overlay textures once per scene. Weather uses bounded particle descriptors and camera-relative drawing; ambient visuals are camera-aware. No additional texture cache, worker, clock, pool or algorithm was introduced.

One narrowly scoped change: at scene creation, collect images representing noninteractive procedural forest detail. Compute visible world bounds from Phaser camera scroll, viewport and zoom; show trees inside a 30-unit margin and hide the rest. The same image handle reappears on camera return; it is not destroyed or recreated by pan/zoom/follow. A last-bounds guard prevents unnecessary full visibility scans for an unchanged camera. Shutdown clears references.

The culling calculation is isolated in `src/game/render/forestCulling.ts`, tested by `forestCulling.test.ts` with Fit, zoom, edge and legacy-viewport scenarios. These are fast unit-level geometry checks, **not** a real browser visual or FPS certificate.

Potential cost: checking each decorative tree on camera changes. The completed optional historical headless Chromium comparison (run #39531644418, before owner changed scope) did not show a meaningful aggregate FPS improvement, and is not used to assert one. Do not expand complexity without local PC evidence.
