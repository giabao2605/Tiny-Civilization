# T06-D render lifecycle QA

Source audit: GameCanvas destroys Phaser on remount, disconnects ResizeObserver and removes host instrumentation. WorldScene releases input/visibility/reduced-motion listeners, weather/ambient adapters and generated lights on SHUTDOWN; now also resets the decorative tree array and cached viewport. No extra timer/listener introduced.

New browser tests under `tests/e2e/t06d-forest-culling.spec.ts` assert viewport zoom reduces visible decorative sprites, fit restores them, total sprites/textures/canvas remain stable and paused world tick/digest does not change. A second test imports the **genuine** 48x48/50 NPC v5 fixture, camera zoom/fit then checks paused tick and one canvas. Actual Chromium test conclusion PENDING.

Unmeasured: 60-120min Windows soak, all 48x48 speed/seed combinations, hardware GPU/resource residency, repeated 100-cycle pan/remount and audio listening. A source cleanup path alone is NOT a leak proof.
