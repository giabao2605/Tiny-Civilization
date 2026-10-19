# N03-E → N03-F handoff (conditional)

## State and gating
- Base: `main@7e8c49bb`, N03-D merged via PR #26. Branch: `feat/n03-e-path-recovery-fast-ci`, PR #27. **DO NOT MERGE without explicit owner request.**
- Code: bounded reachable home/commons recovery; isolated honest waiting activity/retry; in-flight path validation; Inspector Vietnamese diagnostics; deterministic optional `ShelterRequest`.
- New QA: `src/sim/n03e.recovery.test.ts`. Frozen N03-A fixtures, N03-C strict economic gates, N03-D POI scheduling and v5/v6 save rules must remain intact.
- **CI policy is newly changed:** standard `Tiny Civilization CI / checks` runs no Chromium, only npm ci/audit/typecheck/lint/Vitest/build. Full E2E is a *different manual-only* workflow and Pages is a manual-only deploy. **N03-F MUST NOT put Chromium, production Playwright smoke or screenshots back into push/PR jobs.** See [workflow guide](CI_FAST_AND_MANUAL_E2E.md).
- Source commit `80003379` Fast CI [#39196924014](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39196924014) **PASS**: 270/270 tests in 33 files, audit/typecheck/lint/build; job duration **2m54s**. N03-D final vs N03-E all 27 normal-world 720h metric records match in economy/gameplay and route counters; hosted Node tick p95 can be higher, see [performance](N03_E_PERFORMANCE.md). **Full manual E2E NOT RUN**, Windows QA NOT RUN. Documentation-only follow-up commits need final-HEAD CI. No claim of Chromium verification without actual run.

## Recommended N03-F execution
1. Confirm N03-E final commit, PR and owner-approved merge; confirm Fast CI PASS and no survival/economy regression.
2. Analyze `N03C_SIM_BENCH` across 48/96 × 20/50/100 × seed 101/107/12345 × 720h, including tick p50/p95, path/BFS calls, weighted acceptance, fallback, routeBlocked, stalled cooldown counts and goal oscillation.
3. Add tightly scoped diagnostics for isolated NPC only if the current `blockedGoal`/retry and event snapshots are insufficient; don't change schema without proven need.
4. Manually dispatch Full E2E on exactly final tested ref when available; check camera/Follow/Inspector/game startup, production smoke, console errors and artifacts. Windows PC actual FPS/long soak is a separate manual gate.
5. Reject survival/trade/food regressions and preserve the 4-step per-hour guarded weighted routing checkpoint. No second AI state machine, speculative path cache, weather implementation or worker.
6. Publish measured comparisons, remaining watchability gaps, QA status and next phase handoff. Keep PR unmerged unless separately requested.

## Scope not included
No rain, storm, fog, day/night changes or weather visuals in N03-E. Plan 04 owns those systems. Shelter hook redirects only optional/non-producing schedules so an external weather input cannot override starvation, transactions or governance.
