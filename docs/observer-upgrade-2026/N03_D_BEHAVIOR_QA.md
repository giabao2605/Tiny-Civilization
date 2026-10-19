# N03-D — Behavior and integration QA

## Evidence matrix

| Gate | Coverage | Status |
|---|---|---|
| Eligibility, safe food/rest/work preemption | `src/sim/n03d.routines.test.ts` | PENDING final-head CI |
| Event POI only, walkability, ≤8-step reachable path, bounded duration/cooldown | same | PENDING |
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

## Corrective QA findings (actual hosted GitHub Actions, 2026-10-19)

- N03-C main run [#39187351220](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39187351220) **PASS** and provides the accepted paired 720h baseline.
- N03-D event-only candidate [#39188711226](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39188711226) passed **259/260 Vitest tests** including the frozen N03-A golden tests and 720-hour paired economy/survival invariants. Its one failed test found an early 20:00 home transition; fix committed at `f7355ff3`. On [#39189042120](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39189042120), typecheck, lint, unit/integration and build **PASS**; Playwright run was cancelled by a later revision, so not valid final E2E evidence.
- An experimental expansion to decorative scenic POIs [#39189642231](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39189642231) **FAILED** the immutable `v6-96-p100-seed12345-t0` N03-A golden case (259/260 Vitest), and regressed production food/deaths at 100 NPC seed12345 over 720h. This branch revision was fully **reverted**. No golden fixtures were rewritten or thresholds relaxed.
- The rejected scenic version increased deaths **0→2** and reduced food production **2511→2464** at 100 NPC, seed12345. The event-only candidate avoided that death regression and preserved the frozen golden in the previous successful sub-suite.
- **Final rollback HEAD CI/Chromium: PENDING** until the run on the final commit completes. The simulation's normal-world event visits were only 0–3 per 720h in tested event-only samples: this is an important observer-frequency limitation, not proof of immersive normal play. Purposefully staged Playwright fixture must demonstrate observation.
