# T06-B — R01 lifecycle regression and test scope

## Reproduction from pre-fix source
At `main@6b44a6f`, `livingCoordinator.start()` returns an empty disposer when a timer already exists. Sequence: A starts -> timer runs; B starts -> gets no-op disposer; A disposes -> clears interval/listener while B remains; B disposes -> no-op. This is a concrete source-code reproduction of R01; the new automated regression checks the observable sequence on the fixed code. No unmerged PR #40 code was adopted.

## Minimal correction
Reference count increments on every `start()`. A single interval and `visibilitychange` listener are registered only on transition 0→1; each returned disposer has a local `released` flag; last release performs one clear/remove/reset. Counts `leases`, `timerStarts`, `timerStops`, `timerActive`, `visibilityListenerAttached` are readable only, not saved.

## Targeted test
`t06b.instrumentation.test.ts` uses stubbed time, interval and visibility: two leases, A double dispose, B continues another tick, hidden suppresses catch-up, visible resumes one normal tick, final B double dispose removes timer/listener exactly once, remount/new third lease runs and disposes. This tests StrictMode-like setup/cleanup without mounting React itself.

The new optional `tests/e2e/t06b-diagnostics.spec.ts` checks DEV sampling controls, clock lease count and Game instance created/destroyed counters across a real canvas recreation, but remains **NOT RUN** in this environment. Existing GameCanvas cleanup disposes ResizeObserver and rAF, destroys Phaser Game and removes old per-host diagnostics closure. Scene shutdown already removes visibility/media-query/pointer listeners and destroys ambient/weather visuals. Added scene lifetime counters for browser profiling, but actual multi-cycle Chromium remount/GC absence, external device GPU/audio cleanup and soak remain **NOT RUN**. No gameplay-level lifecycle mutation was introduced.
