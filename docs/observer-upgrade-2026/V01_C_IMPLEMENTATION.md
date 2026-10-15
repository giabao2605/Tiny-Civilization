# V01-C — Art Kit, Terrain, Buildings & Props

**Date:** 2026-10-15
**Branch:** `feat/v01-c-art-kit` from `main@bffe91e9`
**Baseline gate:** V01-B PR #12 merged; post-merge Actions run [38711895996](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38711895996) completed **PASS**.
**Acceptance:** **PARTIAL until branch CI, screenshot review, and comparative performance evidence are evaluated.** Do not auto-merge.

## Rendering design

- `render/visualHash.ts`: deterministic display-only 32-bit spatial/layer hash, never importing or modifying game PRNG. Home ordinal + seed cycles through four distinct silhouettes, while existing `home`, `work`, `market`, `commons` `SiteKind` remain untouched.
- `render/terrain.ts`: seed-stable grass texture/dry patches/flower/rock; forest ground variation; packed-earth roads with true cardinal neighbor edges and directional ruts; bank edges for actual water cells, shoreline on grass and restrained ripple detail. No decorative line that claims a new cross-water shortcut.
- `render/artKit.ts`: **18 original procedural pixel textures**, including six different building geometries, three tree silhouettes and nine environment props. Generated only once per Phaser Game and filtered NEAREST.
- `WorldScene.ts`: terrain drawn once to a single seeded ground texture; foliage and building/prop sprite objects sorted by anchor-foot Y; moving NPC depth updated during tween frames and after completed/skipped moves. Selection marker is displayed above roofs/foliage. No input handler or camera rewrites.
- Props are read-only artwork near existing site positions: well, bench, notice sign on commons; crops/woodpile by existing work site labels; crates near market; occasional fences and barrels by homes. They are **not** resource stocks, roads, colliders, entrances, extra sites or gameplay items.
- Presentation ground texture key is regenerated when the scene restarts; art-kit texture keys reuse cached assets during a game instance. Renderers do not set `world.rngState`, alter `WorldState`, create new terrain kinds or consume RNG.

## Performance/lifecycle note

Static 48×48 tile drawing goes into **one** generated terrain image instead of 2,304 display objects. Building, foliage and prop textures are shared. Tree density is bounded at approximately one in seven forest tiles; no per-frame terrain repaint or random selection. NPC containers and tweens retain V01-B behavior, with one additional depth update per movement frame.

Generated assets remain in the Phaser TextureManager for the lifetime of their Phaser Game; destroyed when React tears down the game. Scene restarts regenerate the ground texture and dispose previous scene sprites. If future seed switching creates excessive allocation pressure, profile and introduce an LRU for seed-specific caches; do not prematurely add shaders.

## Test/evidence map

- Pure deterministic unit tests: `src/game/render/visualHash.test.ts`.
- Existing sim/persistence/camera tests must remain unchanged.
- New Playwright matrix: `tests/e2e/observer-v01-c.spec.ts`: 1366×768, 1920×1080, 2560×1080, 390×844, seed 12345, paused tick, Fit/Reset, select NPC, save stability, reset canvas, page errors.
- New CI Chromium 20/100 NPC at 1×/20×: mean rAF FPS, frame p50/p95, JS heap and canvas count. These are comparative CI samples, **not measured game FPS on a physical PC**. V01-B predecessor performance sample is in V01-B artifacts.
- GitHub CI preserves `v01-c-*.png` and `v01-c-*.json` to `observer-v01-c-evidence/` before production smoke.
- **Before screenshot evidence:** V01-B screenshots from prior CI artifacts. **After screenshot evidence:** V01-C PR artifacts once Actions run.
- **Actual local npm/Playwright/physical PC checks:** NOT RUN in the current connector execution environment. **Physical PC FPS:** NOT VERIFIED.

## Open acceptance items

1. Inspect actual screenshots across scales to verify terrain, homes, occlusion and text readability, including atlas/proof sheet details.
2. Check 20/100 NPC performance comparison on **same Chromium runner** before/after, and separately profile on a real PC.
3. Manually verify NPC in front of/behind roofs and trees, JSON import/export, repeat seed changes and long-running memory.
4. Mark complete **only** if all final CI tests pass and the visual/functional observations are satisfactory.

**Rollback:** revert the V01-C-only renderer modules, `WorldScene.ts` art integration, V01-C test, CI evidence change and Observer documentation. No migration or game save conversion required.
