# A05-A — QA verification and limits

**Verified A05-A code commit:** `16ee6590ef23b8e5990b269be9c5fe321d81bf40`. [Fast CI #39358669392](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39358669392) SUCCESS on exact code SHA: **43/43 test files, 364/364 tests PASS**, npm ci, production dependency audit, TypeScript, ESLint and build all PASS. The final documentation-only HEAD still requires the same CI verification. No Chromium/Windows/audio/soak claims are inferred.

**Baseline confirmed:** E04-F PR #34 merged, `main@bd43ed2dc81e252400ef055c3f19bd413ad80973`, post-merge [Fast CI #39355971369](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39355971369) success on exact SHA.

| Gate | Evidence planned | Status on verified code SHA 16ee6590 |
|---|---|---|
| Contract/type | 11 catalog IDs, discriminant, real anchor schema, invalid payload | PASS |
| 48/96 & population 20/50/100 | Indexed real anchors, no false POIs/roads, off-map/water/dangling | NOT RUN |
| Weather and hour | Clear/rain/fog, day/dawn/dusk/night, shelter and observed rain end | PASS |
| Social | Co-located real actors vs separated actors | PASS |
| Determinism | Same seed, canonical tick, virtualMs; no input mutation | PASS |
| Replay | 72-tick ambient-on vs off exact WorldState equality on both maps | PASS |
| Budget/lifecycle | Duplicate/budget/cooldown, started/ended/cancelled and reset | PASS |
| Fast CI | npm ci, prod audit, typecheck, lint, Vitest, build | PASS |
| Browser E2E / Windows audio/screenshots | No visuals or audio in A05-A | NOT RUN |
| FPS/memory/soak; sign-of-life 30s and 3 categories/5min | A05-C/E after real rendering | NOT MEASURED |

Do **not** convert NOT RUN to PASS without exact final HEAD results. Node tests cannot demonstrate Windows frame rate, audio or real 5-minute observation.
