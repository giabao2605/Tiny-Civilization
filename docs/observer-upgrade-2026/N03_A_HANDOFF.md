# N03-A — NPC AI & Navigation Handoff to N03-B

**Task:** Behavior audit, immutable golden traces and deterministic regression only. **Repository:** https://github.com/giabao2605/Tiny-Civilization  
**Base:** `main@cf72134349e9ab3ea800393a96c48c3eb21923c8` | **Branch:** `feat/n03-a-behavior-audit-golden-fixtures` | **PR:** https://github.com/giabao2605/Tiny-Civilization/pull/23 | **Merge:** NO.

## Scope / ownership

N03-A introduces no actual NPC behavior. Existing `engine.ts`, `pathfinding.ts`, `economy.ts`, `social.ts`, `governance.ts`, `WorldScene.ts` and save schema remain production-authoritative; no A*, weighted path costs, new goals, weather/shelter, day/night or audio. This slice adds audit documents, trace fixture, tests and measurement, then PR. It does **not** claim to have fixed performance or made NPC visibly more lifelike.

## Acceptance checklist

| Gate | Expected |
|---|---|
| PR #21/#22 merged, latest main CI PASS | PASS (run #39009292713) |
| 4×48 golden trace and five checkpoints, frozen on disk | Required |
| same-seed commands/RNG/event equality | Required |
| strict v5 original SHA and old 720→816 continuation | Required |
| 96 v6 20/50/100 and roundtrip | Required |
| valid 4-neighbor/no-water/no-teleport movement | Required |
| money/food/wood provenance and dead actors | Required |
| reproducible synthetic RouteBlocked/fallback | Required |
| measured performance baseline and runner metadata | Required |
| typecheck, lint, unit, build, real Phaser E2E and production smoke | Required |
| Physical Windows GPU/60–120m soak | **PARTIAL/NOT RUN, carry forward** |

## Known technical risks

- `engine.ts` may not recalculate on a stale empty route with unchanged destination; no spontaneous failing seed proven. Do not label critical until reproduced under valid state.
- Node standalone path timings are proxy samples, not GPU FPS or integrated path-only latency.
- Renderer 20× may intentionally snap stale intermediate visual frames while simulation remains exact.
- Full 96×96 map can still have expensive BFS traffic. N03-B must measure new algorithm against **same test seeds/runners** and never infer a GPU speedup from a Node benchmark.

## Rollback / handover

Rollback is **revert PR #23** (tests/docs only), no save migration and no production logic to undo. Preserve PR #21/#22 fixes. N03-B may start only after the manifest is frozen, all final-HEAD automated checks PASS with evidence and explicit owner acceptance of Windows hardware PARTIAL. N03-B's weighted A* implementation must be a **separate branch/PR**; never update N03-A baselines to make new routing pass silently.

## Evidence at golden freeze

Initial independent CI capturing literal fixtures [#39011617399](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39011617399) **PASS** (Vitest, Chromium E2E and production smoke). Four exact expected 48-tick traces with 5 checkpoints and RNG/event/state digest are now committed. Final PR-HEAD CI must PASS before calling this `N03-A VERIFIED`, and the PR review/merge remains owner-controlled. Physical Windows perf/soak **PARTIAL** and not an algorithmic blocking assumption. See metric table in `N03_A_REGRESSION_QA.md`.

