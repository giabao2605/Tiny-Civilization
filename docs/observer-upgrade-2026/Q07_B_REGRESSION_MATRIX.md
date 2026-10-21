# Q07-B automated regression coverage matrix

Status below distinguishes added assertions from existing test definitions. Exact-head CI PASS is required before tagging COVERED (otherwise NOT RUN).

| Scope | Automation | Status before final CI |
|---|---|---|
| SIM-01/02: independent v5/v6 replay and seed matrix | `src/sim/q07b.replay.test.ts`, `engine.test.ts`, `weather.test.ts` | NEW, NOT RUN on final HEAD |
| SIM-03/04: pause, speed, observer pace, hidden backlog | `src/sim/clock.test.ts`, coordinator lifecycle tests | REUSE, NOT RUN on final HEAD |
| SIM-05/06: market ownership, social and household | `src/sim/economy.test.ts`, `social.test.ts` | REUSE, NOT RUN on final HEAD |
| SIM-07/08: governance request ordering, weather | `src/sim/governance.test.ts`, `weather.test.ts` | REUSE, NOT RUN on final HEAD |
| SIM-09/10: weighted route, barrier and fallback | `src/sim/weightedPathfinding.test.ts`, `world96.test.ts`, `weatherShelter.test.ts` | REUSE, NOT RUN on final HEAD |
| SAVE-01/02/03: format 1/2/3 | `src/persistence/legacy-v5.fixture.test.ts`, `t06c.integrity.test.ts`, `weather.test.ts` | REUSE, NOT RUN on final HEAD |
| SAVE-04/05/06/07: malformed, 8MiB, references and failed import | `src/persistence/save.test.ts`, `t06c.integrity.test.ts` | REUSE, NOT RUN on final HEAD |
| SAVE-08/09: queued requests and split replay | `t06c.integrity.test.ts`, `q07b.replay.test.ts` | NEW + REUSE, NOT RUN on final HEAD |
| SAVE-10: 12 frozen hashes | `src/persistence/t06c.golden.test.ts` | REUSE, NOT RUN on final HEAD |
| Ambient/camera/audio logic | existing `src/game/ambient`, `camera`, `audio` suites | REUSE, NOT RUN on final HEAD |
| Real browser, screenshots, audio, soak | Q07-C/D/E | NOT RUN |
| Hardware FPS, frame p95, heap | Q07-E | NOT MEASURED |

Fixture: Q07-A manifest `101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 12345` × `20, 50, 100`; 96×96, ticks 0→2; additional 48×48 seed 101 population 20 and 96×96 seed 12345 population 50, 0→24 and saved 24→48. No governance commands in these *new* cases; queued-command evidence comes from existing T06-C tests.
