# T06-D deterministic and save correctness QA

Authoritative sim and `src/persistence/save.ts` are unchanged by T06-D; fixed forest visibility consumes no gameplay/weather PRNG, creates no clock and does not affect engine ticks. Main baseline and culling candidate both use unchanged 12 frozen SHA-256 checkpoints and genuine v5 fixture.

Fast CI [#39530519830](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39530519830) at `f22c8382` SUCCESS, **51/51 Vitest files and 444/444 tests** including T06-C golden, save migration, atomic invalid imports, clock and diagnostics parity. Production dependency audit, typecheck/lint/build also PASS. Latest branch HEAD after benchmark harness maintenance: exact-final-HEAD Fast CI **PENDING**, do not copy earlier PASS to final SHA.

Browser v5 48x48 fixture import, zoom/fit stability and canvas count checked by the new targeted E2E test when run. Full cross-matrix regression, physical Windows, E2E full suite and soak: NOT RUN/NOT MEASURED. Never rewrite golden expected hashes.
