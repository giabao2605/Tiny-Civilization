# T06-B — Implementation and architecture boundaries (2026-10-20)

## Verified dependency
Base `main@6b44a6f0e81e99438b1a8238153b406cfdf108d3`, PR #41 merged; main Fast CI #39390044744 SUCCESS (48 files / 400 tests). PR #40 closed, never merged. T06-B is Draft PR #42 on `feat/t06-b-instrumentation`; no merge, Pages or engine/save rewrite.

## Source changes
- `src/app/observerMetrics.ts`: coordinator-owned optional fixed-size (128 ticks / 128 UI publication gaps) read-only measurements.
- `src/app/livingCoordinator.ts`: timing wraps only `advanceOneTick`; route/BFS/weighted/fallback counter deltas are read around each canonical tick; UI publication gap and counts outside WorldState. Reset on valid import/reset; diagnostics OFF by default. Reference-counted `start()` leases with per-lease idempotent disposal (R01).
- `src/game/createGame.ts`: existing DEV performance endpoint now includes 120 latest Phaser STEP frame samples, p50/p95/max; unsupported GPU time/OS memory null.
- `src/game/scenes/WorldScene.ts`: scene creates/shutdowns/restarts, direct camera readout and weather particle counters.
- `src/game/render/weatherLayer.ts`: actual line-segment count and finite particle budget.
- `src/game/audio/weatherAudio.ts`: audio diagnostics return context state, active voices/loops, voice limit and bus settings. Existing ambient director/visual counters reused.
- `src/app/App.tsx`: DEV-only `?observerPerf=1` compact collapsed readout, manual sample and on/off controls.
- `src/app/t06b.instrumentation.test.ts`: lease and diagnostic parity regressions.
- `tests/e2e/t06b-diagnostics.spec.ts`: optional Chromium diagnostics toggle and GameCanvas remount smoke (NOT RUN in this environment).

## Boundaries
`WorldState` remains authoritative only in coordinator/engine. Camera, weather particles, ambient director/visuals, Web Audio and debug samplers cannot dispatch gameplay mutations. No secondary simulation clock, gameplay PRNG consumption, renderer rewrite, pathfinding optimization, save parser/schema/migration change, backend, worker or desktop packager. Existing pre-T06-B routing diagnostic counters are global: concurrent independent coordinator benchmarking can contaminate attribution and must be serialized.

R01 source before fix: second `start()` returned no-op disposer while first cleanup stopped shared interval. New lease count allows exactly one shared interval/listener until final release; the last disposer resets the accumulator. See lifecycle QA for reproduction and evidence status.

## Acceptance
Code is proposed, not merged. Exact final-head Fast CI result is authoritative. Browser/physical Windows/audio/long-soak are separate gates, not covered by TypeScript or mock tests.
