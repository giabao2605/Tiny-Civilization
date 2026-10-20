# T06-A — Baseline quality and determinism evidence

**Verified base:** `4561660af5c55179df90b73e0d41e5f14b75eede`; [CI run #39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907), job `checks` SUCCESS. All statuses below refer to **base main CI** unless candidate final HEAD is explicitly linked in PR #41.

## Exact checks

| Check | Base CI status | Evidence/qualification |
|---|---|---|
| `npm ci` | PASS | GitHub Actions `checks` step |
| `npm audit --omit=dev --audit-level=high` | PASS | Same job, production only |
| `npm run typecheck` | PASS | Same job |
| `npm run lint` | PASS | Same job |
| `npm run test` | PASS | Vitest **47/47 files, 394/394 tests**, 0 reported failed/skipped; duration 98.34 s |
| `npm run build` | PASS | `tsc --noEmit && vite build` |
| `npm run test:e2e` | **NOT RUN** | Only manual `full-e2e.yml`; Fast CI excludes Chromium |
| Physical PC play/speakers | **NOT RUN** | Requires Windows hardware and human inspection |
| Local shell execution in audit environment | **NOT RUN** | No repo checkout / network DNS to GitHub; remote CI is primary execution evidence |

Runner: GitHub-hosted **ubuntu-24.04**, image ubuntu24/20261012.334; Node **v22.23.3** from emitted benchmark log; npm CLI version **NOT RECORDED**; CPU **AMD EPYC 7763 64-Core Processor** as logged by N03A diagnostics. Chromium/browser version **NOT RECORDED (not launched)**. PR final SHA and final CI are recorded in the PR conversation once checks complete.

## Test inventory, not blanket certification

| Concern | Current automated test coverage | Status |
|---|---|---|
| Same seed/commands/ticks, clock paces and RNG | `observerPace.e04a.test.ts`, `e04f.integration.test.ts`, `save.test.ts`, `weather.test.ts`, `prng.test.ts`, behavior goldens | PASS (unit/Node on base main) |
| 48×48 v5 original and 96×96 v6 world | `legacy-v5.fixture.test.ts`, `v6.test.ts`, `dimensions.test.ts`, `world96*.test.ts` | PASS |
| Old save continuation | Frozen `legacy-v5-48x48.json.gz.b64` and `.expected.json`, SHA-256 projection at tick 816, pending policy replay | PASS (fixture is one legacy save, **not** 20/50/100 separate old-save golden fixtures) |
| 20/50/100 populations across both maps | `e04f.integration.test.ts` 48/96 x three tiers x four weather seeds; `v6.test.ts` 96 map split/continuation | PASS |
| Persistence reader/writer contract | `save.ts`: legacy format 1, historical v6 format 2, v6+weather format 3, 8 MiB max | PASS unit; no real localStorage quota benchmark |
| Invalid import no live-state corruption | `save.test.ts`, `v6.test.ts`, `weather.test.ts`; validation before coordinator swap | PASS (unit); browser/localStorage quota **NOT RUN** |
| Pending governance, IDs, resources | `save.test.ts`, `governance.test.ts`, `quality.benchmark.test.ts`, golden v5 fixtures | PASS |
| Camera/render FPS, reduced motion and hidden-tab behavior | Clock and scene model tests; optional Playwright suites for actual app | PARTIAL: unit PASS, real browser **NOT RUN** |
| Ambient RNG/no gameplay influence | `ambient/director.test.ts`: ambient ON/OFF equality, identical weather RNG | PASS unit |
| Ambient director+audio resource cleanup | `ambient/director.test.ts`, `audio/ambientAudio.test.ts` mock AudioContext and visual tests | PARTIAL: unit PASS, physical/soak **NOT RUN** |
| Multi-caller coordinator start/stop leases | Single-caller visibility/clock tests; no multi-lease regression on base | **MISSING**; source-level bug identified |
| Long-run GPU FPS/heap trends | `tests/e2e/*perf*.spec.ts`, optional soak and Windows script | **NOT RUN / NOT MEASURED** on this task |

## Explicit invariants

- No production `Math.random`, Date/RAF values or camera frame delta are allowed to decide gameplay; checked architectural path and existing replay tests, not asserted for all future code.
- `WorldState` stores seed, economic RNG, weather RNG where applicable, tick, stable entity IDs, economy/households/governance; pending food-aid and next request ID are save envelope fields.
- No artificial FPS PASS: Vitest PASS is **not** equivalent to browser QA.
- Candidate T06-A's new timing assertions concern validity/roundtrip only, not wall-clock thresholds or render frames.

## Reproduction

```powershell
git switch main
git pull --ff-only
node --version
npm --version
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

For strict candidate repeat, checkout exact PR final SHA instead of moving `main`. Log terminal versions/results and do not launch `pages.yml`. CI `checks` does **not** run the final two browser commands.
