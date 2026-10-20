# A05-C — Visual Vignettes Implementation (2026-10-20)

**Branch:** feat/a05-c-visual-vignettes. **Base:** main@a5e4d74a27646994775cd44c38054a6f4958b182 (A05-B PR #36 merged; post-merge CI #39364001448 SUCCESS). **Scope:** desktop/local, presentation only.

## Implemented
- `src/game/ambient/visualModel.ts`: deterministic tile-center/cart-segment coordinates, progress clamp, actor-to-handle registry with per-ID deduplication, offscreen release, idempotent cleanup.
- `src/game/ambient/visuals.ts`: source-drawn pixel-art in at most four active Phaser containers with bounded redraw cadence. Cart payload/wheels uses only the preflight 96x96 contiguous road route. Birds land/hop/leave at their authored POI or actual post-rain puddle; cats/dogs make short home-anchored walks. Market stalls change awnings and goods visually (never inventory), real NPC plaza chat adds emote bubbles only, smoke uses three small puffs at the roof, rain shelter uses a compact umbrella cue.
- `src/game/scenes/WorldScene.ts`: create and dispose one adapter per Phaser scene, synchronize on each authoritative snapshot (immediate cancellations) and foreground frame, cull offscreen graphics, honor reduced motion, pause and hidden state. Renderer may be toggled in DEV with `?ambientVisuals=off`; scheduler remains independent.
- `getAmbientDiagnostics()` overlays actual live graphics-handle count over the A05-B scheduler's descriptor-only `renderedActors:0`, and reports cumulative `createdVisuals`/`destroyedVisuals`. View with `?observerPerf` in local dev. Counts refer to Phaser handles, not pixel-proof screenshot or FPS.

## Architectural boundaries
Never call simulation tick/advance, mutate WorldState, citizen IDs, gameplay RNG, weather RNG, economy, social graph, save schema or gameplay paths. No ECS, WebAudio, audio unlock, new weather particles, additional ground/wet layer, window lights, Pages or mobile scope. Pure model remains importable without Phaser for tests.

## Status
Source and unit tests committed. Final head Fast CI must be checked independently; real-PC screenshots, 30s / 5min **on-screen** acceptance, fps and memory are not implied by passing virtual-clock tests. See A05_C_VISUAL_QA.md.
