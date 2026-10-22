# P08-A handoff

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

Current work is preproduction CONDITIONAL; no live 08A code. Recommended next task: document owner decision and capture real PC FPS/frame p95, memory 60–120-minute soak, save/import and 30–180 game-day novice watchability; determine whether trade truly adds observational value. If approved, build isolated pure TS two-settlement escrow prototype and table-driven conservation/idempotency/blocked-route/split-replay tests **without changing WorldState or save format**. Review those results, then separately approve format-4 migration ADR + fixtures, only then integrate production. Preserve Q07-F acceptance status until independently verified. Do not auto-merge/deploy or introduce diplomacy/conflict.
