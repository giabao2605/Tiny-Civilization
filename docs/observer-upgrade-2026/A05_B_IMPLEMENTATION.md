# A05-B — Implementation
Baseline: PR #35 MERGED; main `b52d832f8756d62aa00127616882818a75fd21cb`, post-merge Fast CI #39360324394 SUCCESS.
Branch: `feat/a05-b-ambient-scheduler`. No auto-merge, Pages deployment or full browser soak.

- `src/game/ambient/director.ts`: pure TypeScript deterministic scheduling, per-scene bounded session, virtual presentation milliseconds, weather transitions, actor descriptors and lifetime management.
- `src/game/ambient/routes.ts`: BFS preflight for cart using authentic 96x96 civic main-road cells only. Route of 7–17 adjacent road tiles, else skip; 48x48 never fabricates roads.
- `WorldScene.ts`: instantiate once per scene create, reconcile on snapshot changes, advance in Phaser's existing update, dispose at SHUTDOWN; pause/hidden/reduced-motion support. No new scene or timer.
- `createGame.ts`: optional dev-only `observerPerf` read-only ambient counters; `renderedActors:0` means A05-C not yet present.
- `director.test.ts`: virtual scheduling, determinism, no duplicate per tick, bounded lifecycle, three categories, route and gameplay replay coverage.

Reuse: `AMBIENT_CATALOG`, `ambientCandidates`, `buildAmbientAnchorIndex`, `AMBIENT_LIMITS`, `createAmbientSession`, `tryStartAmbient`, `finishAmbient`, `resetAmbientSession`, `getAmbientMetrics`. There are no save schema, gameplay, RNG, NPC routing, audio or dependency changes.
