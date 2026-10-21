# T06-D — Implementation (local PC only, 2026-10-21)

## Scope
Verified main at `00e8706998d3c55d195ad06242ad1eb3c01d7b46` with T06-C PR #43 MERGED and post-merge Fast CI #39399807790 SUCCESS. T06-D is on `feat/t06-d-render-map-performance`, Draft PR #44. No merge, no deployment.

## Code changes
`WorldScene` retains existing one-time rasterized terrain and road textures; no redundant terrain cache or scene-wide object rebuild. Static, noninteractive forest decorations are registered at scene creation. A 30-world-pixel expanded viewport hides offscreen tree images and reuses the same handles when camera returns. The update is skipped when camera bounds do not change; cleanup discards references on scene shutdown. Presentation diagnostics expose total and visible tree sprites. The small `src/game/render/forestCulling.ts` pure helper has dedicated Vitest coverage. No simulation ticks, NPC routes, RNG, save formats, clock, or governance logic changed.

## Updated acceptance policy
Project owner requested **local PC only** and removal of heavy Chromium benchmarking/mandatory browser gates. Removed T06-D-specific Chromium profile workflow and both new Playwright specs from this branch. Existing historical E2E suites remain in repo and are not part of Fast CI. Do not run Chromium as a T06-D requirement.

Fast CI #39531644349 SUCCESS on earlier HEAD `7b16e8b3` (npm ci/audit/typecheck/lint, 51/51 files, 444/444 tests and build). Exact final HEAD validation is required after these changes; status is not inferred. No physical Windows FPS measurement is claimed.
