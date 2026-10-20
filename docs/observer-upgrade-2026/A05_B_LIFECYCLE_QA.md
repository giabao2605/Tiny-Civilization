# A05-B — Lifecycle QA
## Automated checks
- Started -> active -> expired/ended -> cooldown -> released: Vitest `director.test.ts` (pending exact-HEAD Fast CI).
- Anchor invalidation by dead/moved NPC, canceled on weather/time changes and released: Vitest.
- Hidden/paused virtual time freeze; long background delta dropped; bounded low-FPS delta; reduced-motion skips moving actors: Vitest.
- Same tick re-render and >300s virtual advancement cannot create repeat actor IDs; population 20/50/100 on native 96, migrated 48, legacy v5; route continuity and fail-closed: Vitest.
- Reset and dispose release descriptors; in-memory metrics/cooldowns bounded.
- Phaser integration uses existing Scene SHUTDOWN cleanup hook, WorldScene restart path, and existing GameCanvas.destroy: source-reviewed. **Browser lifecycle integration: NOT RUN**, pending A05-C/E local verification.

## Evidence discipline
Scheduling readiness 30s and virtual 5min three *scheduled* categories: automated test only. Actual rendered actor count: **0 by design**; FPS, screenshot, audio and 60/120-minute soak: **NOT MEASURED**. The scene integration is not yet a visual acceptance.
