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

W02-A initially reported `observer-v01-e-visual.spec.ts` near-edge Follow **one initial failure and a successful retry**. After W02-A merged, [Pages CI 38867210352](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38867210352) **FAILED** the same edge test on the first attempt **and retry**: recorded Y center 173.55 under min 249.43, then X center 217.25 under min 287. This is a verified post-merge regression, not a clean PASS; other 26 E2E passed and all unit/typecheck/lint passed in that run.

**W02-B fix to verify:** `getCameraSnapshot()` applies the existing `clampCamera()` before a status broadcast, including the immediate Follow click snapshot between Phaser frames, so emitted scroll/zoom/viewport are from a genuinely clamped camera. No fake/status-only clamping, no weakening/deleting `observer-v01-e-visual.spec.ts`, no timeout increases. The baseline camera math and render speed remain unchanged. On first W02-B CI [38868350223](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38868350223), **27 E2E passed, 1 skipped, near-edge Follow FAILED on first attempt and retry** even with snapshot-side clamping; reported X center 217.25 below required min 287. This falsified the hypothesis that only unbounded snapshot capture was responsible. Further inspection found the existing E2E sampled the React camera status by **five separate awaited Playwright attribute reads**, allowing zoom/scroll/viewport values from different render-only camera updates to be mixed into one calculation. W02-B now samples all five values in one `evaluate()` DOM read, preserving all original bounds and ±1 tolerance, while also keeping actual camera clamping before status publication. This treats the measurement race rather than deleting or relaxing the test. The result remains **NOT VERIFIED** until final HEAD CI repeats full E2E. Device FPS/heap/GPU soak are V01-E/W02-F outstanding, not W02-B PASS gates.

## Non-goals

No newly playable 96 map or render screenshot of a full 96 WorldState; W02-C supplies generation and W02-E supplies persistence. No Windows FPS claim.
