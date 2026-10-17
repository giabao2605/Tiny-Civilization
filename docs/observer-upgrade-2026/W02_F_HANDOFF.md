# W02-F — Plan 02 Final Handoff

**Branch:** `feat/w02-f-map-density-performance`. **PR:** [#21](https://github.com/giabao2605/Tiny-Civilization/pull/21) (draft). **Main baseline:** `eb0a4d503f0124267e298443d6fd839c5d64de12`. No self-merge.

## Gate checklist (truthful at drafting)

| Acceptance | Status |
|---|---|
| W02-E PR #20 merged; final post-merge CI #38995262805 and Pages #38995262917 | PASS |
| 96×96 seeded production; 20/50/100 and 3 districts/24 POIs/32 entrances | PASS in W02-E main CI |
| W02-F renderer/BFS optimization and exact route parity, 36-case Chromium matrix | PASS candidate CI #38999049391 |
| W02-F candidate npm ci/typecheck/lint/Vitest/build/E2E/production smoke | PASS CI #38999049391 |\n| W02-F final-HEAD checks incl. preserved screenshots & 4-second 100NPC/20× | PENDING |
| Legacy frozen v5 48×48 SHA and deterministic 720→816 on candidate | PASS CI #38999049391 |
| v5 migration and v6 save roundtrip on candidate | PASS CI #38999049391 |
| 36 population/speed/viewport matrix and BFS A/B | PASS candidate CI; full JSON logged |\n| W02-F PNG screenshot preservation/visual human inspection | PENDING (current CI artifact lacks W02-F PNGs) |
| Local Windows PC hardware 60–120 min soak and 60 FPS evidence | NOT RUN / PARTIAL |
| Manual PC visual/user acceptance | NOT RUN |

## Candidate measured outcome

- Same 1920×1080/Fit, 100 NPC/20×: baseline 7.10 FPS, frame p95 216.6ms → optimized 10.15 FPS, p95 166.6ms (short Chromium runner samples, not hardware guarantees).
- GameObjects 512→481 and textures 123→24; Node 48-tick p95 120.824→11.861ms; identical path calls p95 101 and exactly equal reference BFS routes for tested v5/v6 endpoints.
- Of 36 short cases, 34 higher FPS and two lower; treat negative deltas as noisy, not certified reversions.
- `docs/observer-upgrade-2026/W02_F_WINDOWS_SMOKE.md`: repeatable local Windows testing protocol. Actual Windows status **NOT RUN**.

## Open risks and exact next gate

The original W02-E CI benchmark at 100 NPC/20× and 1920×1080/Fit was ~5.63 FPS in headless Chromium; this is an optimization target, not an accepted 60-FPS result. A 60-FPS claim, Windows stability certification or feature-complete Plan 02 claim is prohibited without a physical target machine.

Before approving this PR, require actual final-HEAD CI with frozen SHA/replay, camera/NPC selection/remount, malformed save atomicity, screenshots and measured performance comparison. If any correctness test fails, return **BLOCKED**; if all automated checks pass but Windows smoke/soak remains untested, **Plan 02 remains PARTIAL for physical-PC acceptance**.

**Gate to N03-A — NPC Behavior Audit & Golden Fixtures:** W02-F code must pass automated correctness/visual/profile gates and be reviewed/merged by the repository owner. N03-A may begin *after* accepted Plan 02 geometry, endpoints, save semantics and stable performance envelope, with open physical-PC risks clearly declared. Never implement weighted A*, weather or ambient events in W02-F.

Rollback: revert PR #21 changes (does not alter immutable W02-A fixture, world RNG or schema), retain W02-E verified main baseline. No destructive migration.
