# N03-D — Behavior and integration QA

## Evidence matrix

| Gate | Coverage | Status |
|---|---|---|
| Eligibility, safe food/rest/work preemption | `src/sim/n03d.routines.test.ts` | PENDING final-head CI |
| Eligible event/scenic POIs, excluded unusable props, walkability, ≤8-step reachable path, bounded duration/cooldown | same | PENDING |
| No water, teleport, >4 tiles/hour, consistent selected POI | same and inherited `n03c.integration.test.ts` | PENDING |
| Direct non-phantom social chat and cooldown at event POI | `n03d.routines.test.ts`; existing `social.test.ts` | PENDING |
| Dead actor inert, v5 BFS unaffected, deterministic seed replay | `n03d.routines.test.ts`, existing N03-A golden matrix | PENDING |
| v6 mid-leisure save/load exact continuation | `n03d.routines.test.ts`, `save.test.ts` | PENDING |
| 96×96 20/50/100 × seeds 101/107/12345 × 720h, paired BFS/weighted economy | inherited `n03c.integration.test.ts` (strict baseline and conservation) | PENDING |
| Chromium Inspector/Follow/20×, 2+ days, screenshot, canvas/error | `tests/e2e/n03d-leisure.spec.ts` | PENDING |
| Typecheck/lint/npm test/production smoke | CI workflow | PENDING |

The 720h suite runs its existing per-tick conservation, ownership, trade, no-water/teleport, dead actor and paired N03-C death/food/trade gates. It now emits `leisureStarts` and `leisureIdleHours` for each 96×96 scenario; the 48×48 cases should report zero. The previous N03-C golden expected fixtures were **not** replaced or retuned to accommodate leisure.

## Seeded deterministic reproduction

- Small unit fixture: 96×96, seed **101**, population **20**; two eligible adults placed at an authored event POI. Tick 17→21 covers start/arrive/dwell/depart without using cosmetic simulations.
- Replay fixture: seed **107**, 20 residents, 72 ticks; compare complete `stateDigest` and `rngState`.
- Long integration matrix: **101, 107, 12345** × **20, 50, 100** × **720 ticks**, 96×96 paired BFS/weighted and unchanged 48×48 legacy; runner must report actual pass/fail.
- Chromium fixture: `/?fixture=n03d-leisure-poi` (development only), select a real visitor, inspect reason and POI, Follow, resume at 20× through at least tick 72. Screenshots saved as Playwright artifacts if browser actually runs.

## Manual limitations and honest status

GitHub Actions N03-C merge run [#39187351220](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39187351220) was still **in_progress** at initial audit, not previously certified PASS. Do not waive that prerequisite. Tests and visual outcomes are **NOT yet claimed PASS** from writing source alone. Physical Windows GPU/FPS, a 60–120 minute soak and manual playability on target PC remain **PARTIAL / NOT RUN**.
