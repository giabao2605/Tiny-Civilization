# V01-C → V01-D Handoff

V01-C focuses strictly on art. Branch: `feat/v01-c-art-kit`. Review and merge only after CI and visual QA have been accepted. Required upstream baseline: V01-B merged to `main@bffe91e9`, post-merge CI PASS (run 38711895996).

Read `V01_C_IMPLEMENTATION.md`, `V01_C_ASSET_MANIFEST.md`, `ART_BIBLE.md` and the latest `MASTER_PLAN.md`; verify branch CI before proceeding.

Current renderer facts:
- Seed/layer/tile hash computes presentation-only terrain and art variants, independent of game PRNG.
- Terrain is one generated texture, trees/buildings/props are depth-sorted images, NPC containers update depth as they move.
- Six visual building shapes exist; four home shapes repeat among the 20 homes.
- World remains 48×48×12, schema v5, no weather/day-night, no camera follow/AFK, no new gameplay or audio.
- Camera API remains the V01-B Manual/Fit/Reset controller in `src/game/camera/`.

V01-D should implement its scoped follow/AFK camera functionality only. Do not tie camera logic or idle timers to renderer random hashes. Preserve current selection/tween/canvas lifecycle, verify sleep/visibility/reduced-motion and all camera tests. Do not extend map, AI, weather or sound prematurely.

**Blocking gate:** If the V01-C PR is PARTIAL, visual/occlusion/performance issues must first be resolved in V01-C; do not treat this handoff as acceptance.
