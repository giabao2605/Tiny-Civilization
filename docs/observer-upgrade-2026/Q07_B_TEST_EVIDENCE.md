# Q07-B execution evidence

| Gate | Result | Evidence |
|---|---|---|
| Dependency: Q07-A merged | PASS | PR #48; main `ed6312a16c2e3d9b9e5080a5111d599416849074` |
| Dependency: post-merge main CI | PASS | [CI #39567884486](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39567884486), completed/success, exact SHA |
| Branch | CREATED | `feat/q07-b-regression` |
| First PR SHA Fast CI | PASS | [Actions #39570430682](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39570430682) completed/success on `1241ff987f12144e7f88b754e6b526021506b0b7`; npm ci/audit/typecheck/lint/Vitest/build all successful |\n| Documentation final HEAD Fast CI | PENDING | Evidence update changes branch HEAD; reverify exact final SHA |
| `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` | NOT RUN LOCALLY | Terminal GitHub DNS unavailable; rely on exact-head Actions |
| New seed replay assertions | PASS on `1241ff987f12144e7f88b754e6b526021506b0b7` | `src/sim/q07b.replay.test.ts` |
| Legacy v5 and formats 2/3 | PASS on `1241ff987f12144e7f88b754e6b526021506b0b7` | existing save/integrity tests |
| Golden 12 SHA-256 checkpoints | PASS on `1241ff987f12144e7f88b754e6b526021506b0b7` | `src/persistence/t06c.golden.test.ts`, immutable |
| Browser/PC/screenshot/audio/soak | NOT RUN | Optional manual stage |
| FPS, memory, GPU, CPU | NOT MEASURED | Q07-E |

Fixture and command evidence: see `Q07_B_DETERMINISM_QA.md` and `Q07_B_REGRESSION_MATRIX.md`. The CI SHA, exact command steps and result must be checked before CODE VERIFIED; old CI cannot certify changes.
