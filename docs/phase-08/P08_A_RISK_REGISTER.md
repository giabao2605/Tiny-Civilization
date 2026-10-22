# P08-A risk register

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

| Risk | Severity | Mitigation | Residual gate |
|---|---|---|---|
| Existing save or RNG corruption | Critical | New format ADR/fixtures/atomic import; never edit 12 golden hashes | BLOCKED for production |
| Phantom or duplicate cargo | Critical | Single escrow owner, debit/credit transaction and replay tests | BLOCKED for production |
| Two-world CPU/render overload | High | One rendered settlement, bounded secondary model; benchmark real PC | UNMEASURED |
| Trade lacks observational value | High | Compare with single-village event improvements; novice playtest | UNPROVEN |
| Command replay/duplicate shipment | High | Stable idempotency keys and total ordering | UNTESTED |
| Stranded cargo/extinct settlement | High | Explicit failure/return state transitions | UNTESTED |
| Existing Q07-F product NO-GO | High | Named owner acceptance, logged evidence | OPEN |

Risks are design estimates, not observed Phase-08 defects. No verified new P0/P1/P2/P3 issue identified in this documentation-only slice.
