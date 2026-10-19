# N03-F → Observer Plan 04 handoff (conditional)

## Handoff status
Source branch: `feat/n03-f-performance-watchability`, based on N03-E merge `4b815aff5b3859ea8a47f682fbdc2a44552067ab`. Do **not merge** into main automatically. Existing engine and save model remain untouched; observer metrics and a manual Chromium test are added.

**Go/no-go for this diagnostic PR:** final HEAD Fast CI PASS, 27×720h matrix PASS, 18×72h checks, reproducible replay and documented limitations. Chromium/Playwright was removed from required CI in N03-E; manual browser diagnostics are **optional, never a merge blocker**. N03-F code is ready for owner review on the Fast CI gate, but a complete visual/physical performance acceptance remains PARTIAL without PC evidence.

## For Observer Plan 04: Day/Night & Weather
1. Preserve `advanceOneTick`'s optional `ShelterRequest` interface. Plan 04 must produce deterministic weather state and shelter IDs externally, without preempting critical hunger, work ownership or transactions.
2. Read existing N03-A golden fixtures, N03-C checkpoint guard and 27-run `N03C_SIM_BENCH` before modifying routing/visuals.
3. Keep one engine clock (1 tick = 1 hour), max four cardinal moves/hour, stable entity ordering, no Math.random, v5/v6 compatibility and financial/food/wood conservation.
4. Profile any added weather cost using the same 48/96, 20/50/100, three-seed 720-hour matrix. Record per-run CPU details, realistic p50/p95, no unproved speed claims.
5. Do not advertise proven Windows FPS, GPU frame smoothness, or visually accepted weather without actual local-PC observation. Chromium E2E is optional under N03-E's Fast CI policy and must not become a required check in Plan 04.
6. Future gameplay expansion must not convert the observer game into direct NPC control, nor silently dispatch Pages, browser workflows or merge.

## Known limitation
The 72h watchability counter cannot replace first-person observation of whether scenes feel interesting. Follow jitter and high-speed canvas rendering remain unverified without optional browser or local-PC observation; this is a product-quality limitation, not a mandatory Chromium CI gate.

## N03-F observed blocker handed forward
The 96×96 / 100 NPC first-three-day samples spent ~81% of live NPC-hours moving, had only 79–149 atWork hours / 7,200, and showed no `leisureIdle` event-POI dwell. This is a **real readability/watchability gap**, not an economy or movement-invariant regression. Plan 04 should preserve simulation consistency and not claim this is solved by new weather textures alone; first examine how travel time, camera framing and legitimate POI scheduling combine. A rejected N03-D scenic-POI experiment previously changed deaths/economy, so never re-introduce that mechanic without full replay/financial gates.

Exact final-head [Fast CI #39206062733](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39206062733) **PASS**: 281/281 Vitest, audit/typecheck/lint/build and all seeded 720h/72h diagnostics. Manual Full E2E, artifact review and physical Windows FPS/soak **NOT RUN (OPTIONAL, not a merge gate)**. Branch stays unmerged pending owner decision; overall visual watchability remains PARTIAL.

## Renderer fixes carried forward

5×/20× snapshots can omit actual hourly UI updates, so `LivingSnapshot.renderPaths` now carries transient concatenated authoritative `lastMove` steps to Phaser. This does **not** change save v5/v6; Plan 04 must not accidentally serialize this presentation-only Map or interrupt the single engine clock. A new `Xem hoạt động` control selects actual work, market, social and meaningful event hotspots, independent from simulation and PRNG.

The true long commute on the physically larger map is still an open **gameplay watchability** issue; do not alter hunger/schedule or locations under the guise of an optimization without new accepted goldens and 30-day population/economy evidence.
