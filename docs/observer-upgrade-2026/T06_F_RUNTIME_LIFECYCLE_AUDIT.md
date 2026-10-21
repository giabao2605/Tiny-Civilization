# T06-F runtime lifecycle audit
Source inspection at T06-E main baseline (2026-10-21).

- `livingCoordinator.ts`: a single interval per coordinator, multiple start() leases, idempotent disposers, last lease removes visibility listener and resets clock. Existing `t06b.instrumentation.test.ts` R01 covers multi-lease release, hidden tab and StrictMode-style reacquisition. No evidence of duplicate timers within one coordinator; no engine modifications.
- `GameCanvas.tsx`: dynamic import checks disposed/host connectivity; cleanup cancels rAF, disconnects ResizeObserver, announces null controls, calls `game.destroy(true)`, clears host diagnostic closure. A real PC/browser remount remains unverified.
- `WorldScene.ts`: SHUTDOWN removes pointer event callbacks, visibility and media-query listeners, AFK timeout, scene-owned ambient/weather/lighting objects and texture keys; clears sprite/marker/tween maps.
- `AmbientDirector`: reset clears actors, attempted IDs, session counters; dispose marks unusable. No wall timers or Phaser ownership.
- `WeatherAudio`: React instance owns context/loop sources, voices and seen-event set. `destroy()` stops and disconnects sources, nulls graph, closes context. An asynchronous resume/destroy race was found and fixed; see implementation and audio regression.
- `App.tsx`: effect controls start/stop lease, audio construction/destruction and window keyboard/pointer listener teardown.

Static lifecycle inspection and mock regression coverage do NOT prove browser heap / WebGL driver / GPU reclamation.
