# E04-D Implementation and Verification

**Scope:** weather visuals only on feat/e04-d-weather-visuals, not E04-E NPC shelter/audio or E04-F profiling.

## Implementation
- src/game/render/weatherVisuals.ts: pure clear/cloudy/rain/fog presets, bounded easing, deterministic tile plan and capped particle descriptors.
- src/game/render/weatherLayer.ts: world-anchored wet network, sparse puddles/lake ripples, moving cloud silhouettes, low-alpha depth fog, viewport-bounded rain.
- src/game/scenes/WorldScene.ts: create, retarget from snapshots, update in render frames, reduced-motion, pause/hidden, particle-OFF QA toggle and cleanup. For local Vite visual QA, append ?weatherParticles=off to the URL.
- src/game/render/weatherVisuals.test.ts: four kinds, finite intensity, visual retargeting, seed fixtures, 48/96 world geometry, 20/50/100 NPC immutability and fixed pool.

## Requirements preserved
E04-B dawn/day/dusk/night curve and window/street lights remain visible because emissive layers render above weather grade/fog. Ground wetness, fog and cloudy shapes remain when rain particles are disabled. Rain does not affect NPC AI, movement, routing or game economy. No gameplay state, clock, saves or RNG has been edited. E04-C historical v5 and v6 save migration remain unchanged.

## Honest verification status
GitHub PR Fast CI on exact final commit SHA is the automated acceptance source. The isolated local execution container cannot reach GitHub/npm, so local npm, browser screenshots and physical PC profiling have **not** been performed. Do not claim test PASS, 60 FPS or visually pleasing results until observed. Current mandatory visual QA: PARTIAL. Under the E04-D requirement, do **not** auto-merge without live screenshot/particle-OFF/lifecycle acceptance.

Refer to E04_D_VISUAL_QA.md for exact steps and E04_D_HANDOFF.md for the conditional E04-E gate.