# Q07-F test evidence ledger

Baseline: `main@71aedc08fce9b3e78cf2d4f5df296c16fb955809` (PR #52 merged); [post-merge Fast CI](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39714112744) completed/success on exact merge SHA. Q07-F branch: `feat/q07-f-release-review`. Review date: 2026-10-22. Q07-F final-head CI must be verified separately; this baseline CI does not verify Q07-F changes.

| Check | Evidence | Outcome |
|---|---|---|
| Q07-E merged | [PR #52](https://github.com/giabao2605/Tiny-Civilization/pull/52) | VERIFIED; `main` exact merge SHA |
| Main Fast CI | [Run #39714112744](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39714112744) | completed/success, exact `71aedc08fce9b3e78cf2d4f5df296c16fb955809` |
| Q07-F local npm (ci/audit/typecheck/lint/test/build) | No terminal checkout/installed deps established | NOT RUN LOCALLY |
| Q07-F PR Fast CI | Runs only after PR created | PENDING exact final SHA verification |
| Golden checkpoints | `src/persistence/t06c.golden.test.ts`, `tests/fixtures/t06c-engine-checkpoints.expected.json` | 12 immutable combinations; executed in main Fast CI; no hash changed |
| Atomic rejection | `src/persistence/q07e.atomic.test.ts` | 20/50/100 invalid JSON/engine/RNG/cash/reference/command/8MiB plus 40+40 deterministic continuation; main CI verified |
| Save compatibility | `src/persistence/t06c.integrity.test.ts`, `save.test.ts`, `v6.test.ts` | format 1 genuine v5 48×48; format 2 historical v6 pre-weather; format 3 v6 weather; main CI verified |
| 20/50/100 population | `src/sim/q07b.replay.test.ts` | Automated suites included on main CI, no Q07-F standalone rerun |
| PC qualitative smoke | Owner report 2026-10-22 | USER-REPORTED PASS for basic playability, no machine specification/log |
| Viewport/video, 30s/5m/20–30m | No attached session or capture | NOT RUN |
| FPS p50/p95, CPU/GPU/heap | No named-PC samples | NOT MEASURED |
| Hardware soak 60–120 min | No timed session | NOT RUN |
| Chromium Playwright | Retained; not installed/executed for this review | NOT RUN |

CI PASS does not certify product readiness. No synthetic FPS is reported.
