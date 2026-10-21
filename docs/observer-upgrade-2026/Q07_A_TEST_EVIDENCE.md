# Q07-A evidence register

| Gate | Value | Evidence / limitation |
|---|---|---|
| Plan 06 prerequisites | PASS | PR #46 merged at b144272857dd202dcf6106cd29c4c7dc7207444c; main closeout #47 at be7965292023c554baeca2728057378454b0c148 |
| Post-T06-F main CI | PASS | https://github.com/giabao2605/Tiny-Civilization/actions/runs/39541678338 completed/success on b144272857dd202dcf6106cd29c4c7dc7207444c |
| Q07-A npm ci / audit / typecheck / lint / test / build | PASS on `9deb7a13bdf558c97627a05759b4b2317e6f7e08` | [GitHub Actions #39543852096](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39543852096) completed/success for exact SHA; local terminal commands NOT RUN (DNS) |
| Manifest validator | PASS on `9deb7a13bdf558c97627a05759b4b2317e6f7e08` | Included in `npm run test` on Actions #39543852096 |
| Browser/Playwright | NOT RUN | Historical E2E preserved; no Chromium installation or heavy browser CI |
| PC visual, audio, local offline smoke | NOT RUN | No real PC browser capture collected |
| FPS median / frame p95 / sim tick p95 / heap and resources | NOT MEASURED | No machine/browser measurements performed |
| 30s/5min/20–30min watchability | NOT RUN | Synthetic candidate fixtures cannot substitute for human observer session |
| 60–120min soak | NOT RUN | Not mandatory Q07-A merge gate |
| Golden 12 checkpoints | PASS on `9deb7a13bdf558c97627a05759b4b2317e6f7e08` | Existing Vitest golden suite included in Actions #39543852096; no expected hash changes |

Status semantics: **PASS** requires exact SHA & workflow completed/success, or timestamped local result; **FAIL** explicit failed result; **PARTIAL** only partial criteria; **NOT RUN** unexecuted case; **NOT MEASURED** metric absent. Collect PR run URL and exact SHA in a subsequent evidence update, do not retroactively claim an earlier branch passed.

Evidence update note: the above passing run belongs to the **prior commit** `9deb7a13...`. This documentation-only update changes the branch HEAD; exact final HEAD CI must also finish successfully before calling the Draft PR CODE VERIFIED.
