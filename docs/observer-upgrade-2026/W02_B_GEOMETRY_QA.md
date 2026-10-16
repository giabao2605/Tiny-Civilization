# W02-B — Geometry, BFS, renderer and camera QA

## Test inventory and acceptance

| Test / evidence | Coverage | Execution status at documentation authoring |
| --- | --- | --- |
| `src/sim/grid.test.ts` | Legacy 48 corners, invalid 48 and fractional/NaN values | RUN IN PR CI; pending |
| `src/sim/dimensions.test.ts` | Explicit 48/96 indices 0, 2303, 2256, 9215, 9120, 4608; invalid dims/fractions/Infinity; 9216 encode/decode round trips | RUN IN PR CI; pending |
| `src/sim/dimensions.test.ts` | Synthetic 96 BFS beyond row 48, deterministic N/E/S/W, single water gap detour, full water barrier returns null, no queue overflow, legacy path stays read-only | RUN IN PR CI; pending |
| `src/sim/dimensions.test.ts` | Terrain neighbor lookup after row 48, last cell, invalid neighbor; geometry-only scene restart predicate without changing WorldState | RUN IN PR CI; pending |
| `src/app/coordinator.test.ts` | Default 48 selection and explicit synthetic 96 validation | RUN IN PR CI; pending |
| `src/game/camera/cameraMath.test.ts` | 1152×1152 fit/bounds at 1366×768, 1920×1080, 2560×1080, 390×844; old 576px tests remain | RUN IN PR CI; pending |
| `tests/e2e/observer-w02-b.spec.ts` | Actual v5 browser map: displayed 48×48, resize, Fit/Reset/zoom, saved load, remount, paused tick unchanged | RUN IN PR CI; pending |
| Existing V01-B/C/D/E & release E2E | pan/zoom, Follow, AFK, reduced motion, screenshot, lifecycle and legacy save | RUN IN PR CI; pending |
| Frozen v5 fixture test | Exact JSON/full-world SHA-256 and 720→816 deterministic continuation | RUN IN PR CI; pending |

Local container cannot clone github.com (DNS failure). Therefore `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` and `npm run test:e2e` are **NOT RUN locally**, not implicit passes. GitHub Actions after PR opening will execute them; record final outcome on the PR's commit SHA. Do not conflate a prior branch or base CI with a passing final HEAD.

## Camera and lifecycle checklist

- **Fit/Reset:** world-pixel footprint from dimensions × 12, same `fitZoom` and centered letterboxing.
- **Pan/zoom/Follow/AFK:** same render-only camera modes; clamp using computed world pixel width/height, not the old 576 constant.
- **Viewport:** desktop 1366×768, 1920×1080, ultrawide 2560×1080, narrow 390×844.
- **World replacement:** geometry-change comparison independently triggers scene restart, even if seed and population match. UI loads of v5 remain 48; synthetic 96 only in unit tests.
- **Rendering:** full 96² terrain indexing and neighbor sampling covered by pure synthetic tests; no full Phaser 96 world is created in W02-B.

## Known regression investigation: near-edge Follow

W02-A reported `observer-v01-e-visual.spec.ts` near-edge Follow **one initial failure and one successful retry**, camera Y center 173.55 below allowed minimum 249.43. The W02-B geometry audit finds no hardcoded 576px in the new camera footprint path; it still preserves previous `cameraCenterBounds` and `clampCamera` formulas. Possible causes include renderer/camera frame timing and stale throttled status broadcasts, but **this is a hypothesis, not a proven fix**. Do not delete test, weaken bounds or extend timeouts merely to turn CI green. If final CI reproduces a wrong bound, reproduce and fix geometry within this scope. Device FPS/heap/GPU soak are V01-E/W02-F outstanding, not W02-B PASS gates.

## Non-goals

No newly playable 96 map or render screenshot of a full 96 WorldState; W02-C supplies generation and W02-E supplies persistence. No Windows FPS claim.
