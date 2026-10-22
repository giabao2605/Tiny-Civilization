# Q07-E test evidence

Baseline: Q07-D merged main `42b7b6fd8c107a4bef0414a55ae17b3b9300e020`; [post-merge CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39710052800), exact head.

Added: `src/persistence/q07e.atomic.test.ts` covering invalid import invariance (20/50/100 NPC), native 96×96 split replay (20/50/100 NPC) and writer/reader ID/RNG check. Reused: `src/persistence/t06c.integrity.test.ts`, `src/persistence/save.test.ts`, `src/sim/benchmark.test.ts`, `src/app/livingCoordinator.ts` lifecycle guards.

Local npm commands **NOT RUN** (container cannot resolve github.com to clone). Final Fast CI status must be checked on the final PR SHA; do not infer that these tests passed from source inspection. Historical Playwright tests untouched; Chromium NOT RUN.
