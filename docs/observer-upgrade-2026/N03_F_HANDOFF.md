# N03-F → Observer Plan 04 handoff (conditional)

## Handoff status
Source branch: `feat/n03-f-performance-watchability`, based on N03-E merge `4b815aff5b3859ea8a47f682fbdc2a44552067ab`. Do **not merge** into main automatically. Existing engine and save model remain untouched; observer metrics and a manual Chromium test are added.

**Go/no-go:** N03-F is NOT declared DONE until a final HEAD Fast CI PASS, 720h matrix PASS and an examined manually dispatched Chromium run with screenshots/production smoke. Physical Windows 20× FPS and long soak remain separate partial gates.

## For Observer Plan 04: Day/Night & Weather
1. Preserve `advanceOneTick`'s optional `ShelterRequest` interface. Plan 04 must produce deterministic weather state and shelter IDs externally, without preempting critical hunger, work ownership or transactions.
2. Read existing N03-A golden fixtures, N03-C checkpoint guard and 27-run `N03C_SIM_BENCH` before modifying routing/visuals.
3. Keep one engine clock (1 tick = 1 hour), max four cardinal moves/hour, stable entity ordering, no Math.random, v5/v6 compatibility and financial/food/wood conservation.
4. Profile any added weather cost using the same 48/96, 20/50/100, three-seed 720-hour matrix. Record per-run CPU details, realistic p50/p95, no unproved speed claims.
5. Weather visuals, day/night palette, shelter interaction and dynamic map presentation must be verified with **manual Chromium** on final commit and **Windows physical local play** before advertising FPS/quality.
6. Future gameplay expansion must not convert the observer game into direct NPC control, nor silently dispatch Pages, browser workflows or merge.

## Known limitation
The 72h watchability counter cannot replace first-person observation of whether scenes feel interesting. Follow jitter and high-speed canvas rendering need manual artifacts and Windows GPU/long-soak measurements.
