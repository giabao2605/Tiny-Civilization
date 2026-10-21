# Q07-B implementation

Base main `ed6312a16c2e3d9b9e5080a5111d599416849074`, PR #48 merged, post-merge CI #39567884486 completed/success on exact SHA. Branch `feat/q07-b-regression`.

Scope: additional deterministic regression at `src/sim/q07b.replay.test.ts`. Reuses existing full suite rather than duplicating clock, weighted routing, save migration, economy, social, weather, ambient, camera and audio tests. No changes to production gameplay, RNG, save schemas, frozen checkpoints, legacy bytes or historical Playwright files.

New tests: 3 population parameterized matrix cases each covering 11 Q07-A seeds (33 real 2-tick scenarios, not 33 long soaks), 2 independent replay/save-split cases (48×48 legacy + 96×96 current), 1 isolated weather RNG draw case. These are **6 Vitest cases**, totaling 33 seed/population combinations and two 24+24-hour continuations. No arbitrary new golden hashes.

Execution and actual status are tracked in Q07_B_TEST_EVIDENCE.md. This task is not Plan 07 product acceptance or gameplay balancing.
