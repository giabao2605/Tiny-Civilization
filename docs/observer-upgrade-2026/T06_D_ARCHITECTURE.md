# T06-D architecture and candidate review

Authoritative source: src/sim/engine.ts, src/sim/clock.ts, src/sim/routing.ts and src/sim/pathfinding.ts; rendering must never write world state. Presentation: src/game/scenes/WorldScene.ts; src/app/livingCoordinator.ts owns simulation and UI publication.

Observed from source: terrain and layout are painted in scene setup rather than explicitly redrawn on every frame. Per-node Graphics objects exist; citizen display containers and movement tweens exist. Scene shutdown has explicit listeners/effects/texture cleanup. The coordinator already batches high-speed UI snapshots.

Candidate hypotheses, NOT findings: static terrain raster caching vs GPU upload memory; viewport culling decorative objects vs pan/follow correctness; pooled weather/ambient visuals vs extra lifecycle complexity; presentation-only batching vs responsiveness; route cache vs deterministic tie-break and invalidation. Do not implement any without profiling evidence and rollback criteria.
