# Q07-E implementation

Base: main `42b7b6fd8c107a4bef0414a55ae17b3b9300e020`, Q07-D post-merge CI #39710052800 completed/success, matching SHA. Branch: `feat/q07-e-performance-soak`.

Added `src/persistence/q07e.atomic.test.ts` for coordinator-level atomic invalid import and deterministic split-run readback at 20/50/100 NPC. This is regression coverage, not proof of browser performance. No simulation algorithm, save schema, RNG, gameplay balance, renderer, or historical E2E changes.

Source audit: `livingCoordinator.ts` parses via `parseSave` before swapping state, queued commands, clock settings or visual movement. `start()` returns an idempotent lease release; last release detaches `visibilitychange`, cancels interval and resets clock. Source reading alone cannot prove zero leaks.
