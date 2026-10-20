# T06-C — Implementation audit and minimal persistence correction

**Date:** 2026-10-20. Verified starting point: `main@d91a1b0b772ac25ba86edb159c017fde3b2ad51b`, [T06-B merged PR #42](https://github.com/giabao2605/Tiny-Civilization/pull/42), post-merge [Fast CI #39394639636](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39394639636) SUCCESS. Branch: `feat/t06-c-save-compatibility`, [draft PR #43](https://github.com/giabao2605/Tiny-Civilization/pull/43). Do not merge.

## Source audit
`src/persistence/save.ts` already reads format 1/2/3, validates a 48×48 legacy world *before* migration, preserves seed/tick/rngState/entity IDs and social/economic/governance data, hydrates deterministic weather for old files, and writes format 3 for v6. `livingCoordinator.importSave` parses before committing state, pauses a valid imported world, resets diagnostics without consuming gameplay RNG. `App.tsx` catches browser storage and file-import errors. The v5 golden bytes were already frozen in W02-A, and T06-B lease tests protect scheduler ownership. **No new schema/format or migration framework is warranted.**

## Confirmed defect and correction
`validatePending` verified issued tick/requestId, but treated an arbitrary positive `leaderId` as a valid reference. Both writer and reader therefore accepted pending food-aid commands naming citizens that do not exist. Regression: `src/persistence/t06c.integrity.test.ts` inserts a nonexistent leader ID in valid v5/v6 envelopes and writer inputs. Minimal change: validate the leader's presence in `world.citizens` after full world validation, while leaving election eligibility to the simulation (avoids rejecting previously valid queued commands after a leadership transition). No world RNG, weather RNG, tick ordering, storage key, or format changes.

## Added tests
- `t06c.integrity.test.ts`: forged queued IDs, synthetic pre-weather format-2 48/96 hydration, mismatch envelopes, UTF-8 8 MiB, atomic import at paused/running settings and exact 240-hour migrated 48×48 replay for 20/50/100 NPC.
- `t06c.golden.test.ts`: seed 101/12345 × 20/50/100 × 48/96 checkpoint hashes at tick 24; generation is explicitly **source-derived, not historical user saves**. Hashes must be pinned and independently checked before declaring new goldens frozen.

## Out of scope and evidence limits
No renderer, pathfinding cache, worker, backend, packaging, GitHub Pages, gameplay, governance decision rules or CI workflow edits. GitHub Fast CI executes `npm ci`, production dependency audit, typecheck, lint, Vitest and build; **Chromium E2E and real Windows performance are not included**. See QA and handoff for final exact SHA and gating.
