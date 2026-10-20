# A05-B -> A05-C handoff: Visual Vignettes
1. Read `director.ts` `AmbientActorDescriptor`, `activeActors`, `advance()` and `reconcile()`. Scene stores one `ambientDirector` and advances it with frame delta. Its `AmbientTransition` list identifies starts/ends/cancellations. Do not create a second scheduler or gameplay citizen.
2. A05-C must map each descriptor to a unique Phaser visual handle (keyed by namespaced `ambient:` ID), cancel/destroy on end, reset and SHUTDOWN. Render actual cart on preflight `route` and keep visual movement read-only, not in NPC pathfinding.
3. Build cart/birds/pets/smoke/market/NPC gesture art only in A05-C. Honor reduced motion and offscreen culling. Never duplicate E04-B `window-light` or alter E04-D WeatherLayer lifecycle. Bell/bird/cart audio waits until A05-D.
4. Instrument **rendered** count separately from forecast visibility. In A05-B `renderedActors` is always zero. Re-test actual 30s sign of life, three visibly distinct categories/5min, FPS/memory/soak in A05-E.
5. Avoid stale actor handles across same-seed import and scene.restart, confirm weather transitions and offscreen behavior with browser/manual tests. Route may legitimately reject an isolated main-road cell; fail safely instead of teleporting.
6. Use existing Fast CI on exact PR HEAD for A05-C admission; do not deploy/merge this PR without owner's explicit request.
