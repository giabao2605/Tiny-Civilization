# N03-D — Handoff to N03-E (conditional)

## Branch, baseline, artifacts

- Base: `main@f6e9a54b8158d362a5b617c1ae6ab50bcc5b957e`, PR #25 merged.
- Branch: `feat/n03-d-readable-routines`. Candidate code intentionally **not merged**.
- Implementation: `src/sim/leisure.ts` and minimal engine/world/social/save/Inspector integration.
- Evidence: `src/sim/n03d.routines.test.ts`, `tests/e2e/n03d-leisure.spec.ts`; reused 720-hour N03-C tests now log POI visits and idle hours; no N03-C routing algorithm edits.
- More: [implementation](N03_D_IMPLEMENTATION.md), [behavior QA](N03_D_BEHAVIOR_QA.md), [performance](N03_D_PERFORMANCE.md), [progress](../PROGRESS.md).

## Remaining gates

1. Verify N03-C post-merge run #39187351220 PASS. If not, investigate baseline before accepting this PR.
2. N03-D final HEAD typecheck, lint, Vitest, build, real Chromium and production smoke CI must all PASS.
3. Inspect 96×96 20/50/100 × 101/107/12345 paired 720-hour deaths/food/trades/stock/failedActions/routeBlocked and new visit counts; do not excuse economic or survival regressions.
4. Inspect screenshots for a real visitor, Inspector cause/POI, Follow, pause/resume and 20× through two game-days, with console/asset/canvas clean.
5. Record p50/p95, pathfinding calls and overhead against accepted N03-C HEAD, not rejected earlier iterations.
6. Physical Windows GPU FPS and 60–120 min soak remain **PARTIAL** without on-machine evidence.

## N03-E boundary

After the above gates and owner approval/merge, N03-E may focus on bounded blocked-path recovery and weather shelter **interface only**. Do not prematurely implement weather, Plan 04, replace save schema, remove guarded hourly routing checkpoints or turn decorative POIs into economic sites. The owner must separately request merging N03-D into `main`.

## Regression-driven handoff note (2026-10-19)

The attempted expansion into decorative scenic stops was fully rolled back, because it broke an N03-A 96×96 golden and increased 100-NPC seed12345 deaths (0→2), with food falling 2511→2464 over 720h. Final scope remains **only event-role POIs**. The accepted N03-C guard and historic fixtures must continue to PASS. Ordinary-world event-POI visits are sparse (0–3 visits/720h in intermediate event-only samples); address density and observability through separate evidence-led work, never by sacrificing food, travel safety or altering frozen fixtures. The next handoff is conditioned on green final-HEAD CI, real Chromium screenshot, and measured before/after performance; status stays **PARTIAL** until verified.
