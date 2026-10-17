# W02-F — Plan 02 Final Handoff

**Branch:** `feat/w02-f-map-density-performance`. **PR:** [#21](https://github.com/giabao2605/Tiny-Civilization/pull/21) (draft). **Main baseline:** `eb0a4d503f0124267e298443d6fd839c5d64de12`. No self-merge.

## Gate checklist (truthful at drafting)

| Acceptance | Status |
|---|---|
| W02-E PR #20 merged; final post-merge CI #38995262805 and Pages #38995262917 | PASS |
| 96×96 seeded production; 20/50/100 and 3 districts/24 POIs/32 entrances | PASS in W02-E main CI |
| W02-F modified render/perf path with unit/browser test added | IMPLEMENTED / verification pending |
| W02-F final-HEAD npm ci/typecheck/lint/Vitest/build/E2E/production smoke | PENDING |
| Legacy frozen v5 48×48 SHA and deterministic 720→816 after candidate | PENDING |
| v5 migration and v6 save roundtrip after candidate | PENDING |
| 36 population/speed/viewport frames, new visual screenshots and A/B timing | PENDING |
| Local Windows PC hardware 60–120 min soak and 60 FPS evidence | NOT RUN / PARTIAL |
| Manual PC visual/user acceptance | NOT RUN |

## Open risks and exact next gate

The original W02-E CI benchmark at 100 NPC/20× and 1920×1080/Fit was ~5.63 FPS in headless Chromium; this is an optimization target, not an accepted 60-FPS result. A 60-FPS claim, Windows stability certification or feature-complete Plan 02 claim is prohibited without a physical target machine.

Before approving this PR, require actual final-HEAD CI with frozen SHA/replay, camera/NPC selection/remount, malformed save atomicity, screenshots and measured performance comparison. If any correctness test fails, return **BLOCKED**; if all automated checks pass but Windows smoke/soak remains untested, **Plan 02 remains PARTIAL for physical-PC acceptance**.

**Gate to N03-A — NPC Behavior Audit & Golden Fixtures:** W02-F code must pass automated correctness/visual/profile gates and be reviewed/merged by the repository owner. N03-A may begin *after* accepted Plan 02 geometry, endpoints, save semantics and stable performance envelope, with open physical-PC risks clearly declared. Never implement weighted A*, weather or ambient events in W02-F.

Rollback: revert PR #21 changes (does not alter immutable W02-A fixture, world RNG or schema), retain W02-E verified main baseline. No destructive migration.
