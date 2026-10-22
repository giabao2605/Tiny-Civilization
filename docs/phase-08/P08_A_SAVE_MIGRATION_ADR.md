# P08-A ADR: defer save format migration

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

**Status: proposed / not approved for production.** Present readers: format 1 genuine v5 48×48, format 2 pre-weather v6, format 3 current weather v6. Current writer produces format 3. Source: `src/persistence/save.ts`, `src/sim/world.ts`; see `T06_C_SAVE_COMPATIBILITY.md`.

Do not alter these readers, schema, engine version, `LOCAL_SAVE_KEY`, RNG or weather RNG, tick, ID counters, queued governance commands, or 12 frozen SHA-256 checkpoints in this PR. Proposed future format 4 requires new explicit envelope and strict transaction-oriented validation before any state swap. Transform one village to stable settlement ID without reassigning citizens/sites/market assets; no initial second settlement with copied assets. Require deterministic zero-RNG initialization, explicit schema version bump, finite shipment escrow and unique references. Perform validate-old -> migrate candidate -> validate-new -> atomic commit; rejection leaves current world, pending commands, request IDs and localStorage untouched. Preserve original JSON export for rollback. Reader 1/2/3 remains supported. No downgrade that silently discards cross-town cargo.

**Gate:** draft format-4 fixtures and tests for all three old formats, malicious payloads, reference/escrow integrity, split replay, command queue, 8 MiB bounds, weather RNG and frozen hashes before implementing migration.
