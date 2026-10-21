# Q07-B deterministic regression QA

New scenario Q07-B-SEED-MATRIX: 11 Q07-A seeds × populations 20/50/100, map 96×96, start tick 0, end tick 2; no commands. Oracle: two independent seeded creations, identical full states, digest, events, identities, wallets/inventory, market ownership and total currency. One implementation uses batched stepping; the other uses hourly stepping. Test: `npm run test` running `src/sim/q07b.replay.test.ts`.

Q07-B-LEGACY-REPLAY: seed 101, population 20, 48×48, start 0; 24 hours independently replayed, serialize/parse checkpoint at tick 24 then 24 more hours with repeat saves. Q07-B-MODERN-REPLAY: seed 12345, population 50, 96×96, same steps. These split-run assertions compare independently restored continuations and **do not claim pre-migration v5 and post-migration v6 have identical future weather-influenced trajectories**.

Q07-B-RNG: seed 127 population 20 map 96×96, isolated `advanceWeather` calls tick 1→96 must not modify input `WorldState` or economic rngState. Old weather and engine tests cover the integrated weather replay.

Any actual PASS, SHA and CI URL are recorded in TEST_EVIDENCE; do not interpret this test specification as executed evidence.
