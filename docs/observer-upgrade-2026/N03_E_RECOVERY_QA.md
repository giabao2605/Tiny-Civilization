# N03-E — Recovery verification and quality gates

## Source-level test coverage

`src/sim/n03e.recovery.test.ts` exercises:
- unreachable work destination from a four-way water island; no teleport/false `rest`, actual stranded reason and cooldown;
- bounded retry and single `routeBlocked` event during the cooldown; recovery after restoring traversable neighbors;
- blocked house with reachable commons; no phantom arrival at home;
- a cached route made invalid by water before the next movement;
- urgent personally owned food overriding blocked work, with real ownership deduction;
- death clears route, blocked goal and retry timer, with no ghost travel;
- explicit shelter request, absent-input equivalence, deterministic reproduction and critical food priority;
- v5 legacy import, v6 96×96 import and rejection of invalid site coordinate.

Unmodified regression gates: `n03a.behavior.test.ts` + frozen goldens, `n03a.blocked.test.ts`, `n03c.integration.test.ts` 720h matrix for seed 101/107/12345 × population 20/50/100 × 48/96 world, `n03d.routines.test.ts`, economy/social/governance/save/invariants.

## QA status (updated 2026-10-19)
- **Source code commit `800033790e5f28f67b63a055b351dd71ccb428ac`: Fast CI [#39196924014](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39196924014) PASS**. npm ci, production audit (0 production vulnerabilities), TypeScript, lint, **33/33 Vitest files and 270/270 cases**, and Vite/TypeScript build all PASS. The hosted job started 03:56:11 UTC, completed 03:59:05 UTC: **2m54s job duration**; queued scheduling time excluded.
- This record certifies source commit `80003379`. Any subsequent documentation-only commit must also receive its own final-HEAD Fast CI PASS; do not silently transfer run attribution.
- Full E2E on final commit: **NOT RUN**. Manual GitHub Actions dispatch is required; `workflow_dispatch` may not be registered in Actions before the workflow reaches the default branch. This is a limitation, not a browser PASS.
- Chromium visual blocked-Inspector, camera Follow, render/console and production smoke: **NOT VERIFIED** in N03-E (existing E2E retained, manual run required).
- Physical Windows local-play smoke, frame-time/FPS, 60–120-minute soak: **NOT RUN**.
- Controlled flooded island fixtures intentionally mutate generated terrain; those synthetic worlds are **not valid v6 production saves**. We separately test unchanged valid v5/v6 save compatibility and strict invalid-data rejection.
- Required checks on `main`: no branch-protection/required checks were configured when inspected; keep the existing Fast CI job name `checks`.

## Acceptance rule
Only claim PASS after a **finished final-HEAD** CI run. Do not accept altered N03-A fixture digests, failure-masking `skip`, higher deaths, lower food/trades in N03-C strict paired tests, route teleportation, or unexplained behavioral drift. Full E2E state stays NOT RUN until actual manual Chromium evidence exists.
