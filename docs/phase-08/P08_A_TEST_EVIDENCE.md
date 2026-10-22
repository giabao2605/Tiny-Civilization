# P08-A evidence ledger

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

| Check | Evidence | Result |
|---|---|---|
| Q07-F merged | [PR #53](https://github.com/giabao2605/Tiny-Civilization/pull/53) merge `52a06752...` | VERIFIED |
| main post-merge CI | [Actions #39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823), exact SHA | PASS |
| Existing three save formats | `T06_C_SAVE_COMPATIBILITY.md`, `src/persistence/save.ts` | SOURCE VERIFIED |
| N03 100 NPC 96×96 Node p95 | `N03_F_PERFORMANCE.md`, CI #39199969967 | HISTORICAL, not Phase-08 measurement |
| Q07-F product criteria | `Q07_F_GO_NO_GO_DECISION.md` | NO-GO |
| Phase-08 CI on new head | Await new branch PR workflow | PENDING |
| 08A tests or full Fast CI locally | No production/test files changed | NOT RUN |
| Physical PC FPS/memory/soak | No instrumented log | NOT MEASURED / NOT RUN |
| Multi-settlement simulation and trade | Not implemented | NOT RUN |

Do not mistake baseline CI for exact PR HEAD validation. No Chromium installation is required for Phase-08 Fast CI.
