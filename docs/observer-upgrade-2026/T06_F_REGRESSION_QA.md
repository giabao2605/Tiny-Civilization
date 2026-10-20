# T06-F — Regression and determinism protection

| Assertion | Coverage | Status |
| --- | --- | --- |
| Same seed, initial WorldState, commands and ticks → same digest | Existing `src/sim/*.test.ts`, `ambient.test.ts` deterministic dual replay; renderer/audio changes only expose diagnostics | Final CI PENDING |
| 1 tick=1 game-hour, 1×/5×/20× and Observer Pace unchanged | `clock.ts` unmodified; prior clock, observer tests | Final CI PENDING |
| No separate gameplay clock | Reference-count **one** existing `setInterval` in `livingCoordinator.start()`, test asserts single timer | Code authored; CI PENDING |
| No hidden catch-up | clock rejects hidden/long gaps; `livingCoordinator.t06f.test.ts` clocks fake elapsed, optional tab E2E uses real tab switch | Code authored; CI PENDING; E2E NOT RUN |
| v5 48×48 and v6 48/96 migration/roundtrip | Existing `save.test.ts`, optional new actual browser import/roundtrip script | Final CI PENDING; E2E NOT RUN |
| Renderer/audio profiling does not mutate WorldState/save | `createGame.ts` DEV-only getter, `WorldScene` WeatherLayer read-only getter, `WeatherAudio.diagnostics` getter. No sim/save code edited | Static audit PASS; browser NOT RUN |
| ≤4 actors/one-shots, ≤2 loops, weather active≤budget | Existing ambient/audio unit mock coverage; new E2E counter checks | Final CI PENDING; E2E NOT RUN |
| No React/Scene/canvas duplicates on restarts | `t06f-lifecycle.spec.ts` resets/imports/remounts with actual DOM count | E2E NOT RUN |
| No change to money/inventory/households/governance/seed RNG | No changes to `src/sim/` or `src/persistence/save.ts`; existing golden files untouched | Static audit PASS; final CI PENDING |

**Fast CI required on exact final branch SHA:** `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. PR checks can validate these; browser E2E is manual-only by policy.

**Never** strengthen a claim from *authored* to *PASS* until the relevant check ran, and never modify snapshots just to make CI green.
