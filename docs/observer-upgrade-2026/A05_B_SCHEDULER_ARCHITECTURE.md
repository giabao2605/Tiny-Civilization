# A05-B — Ambient Scheduler Architecture
```text
LivingSnapshot (authoritative/read-only)
  -> WorldScene.setSnapshot -> AmbientDirector.reconcile
      -> anchor index (only canonical tick/world replacement)
      -> valid event catalog/anchor/weather/NPC conditions
  -> WorldScene.update(delta) -> AmbientDirector.advance
      -> bounded presentation clock -> expiration/cancellation -> release
      -> one selection per 8 seconds -> deterministic category fairness
      -> route preflight -> A05-A tryStartAmbient -> actor descriptor
  -> Scene SHUTDOWN -> dispose/reset
```

The renderer never changes `WorldState`, citizen IDs, event timeline, market or weather RNG. The elapsed clock counts only foreground, unpaused frame time. Individual valid deltas are capped at 250ms; deltas above 1000ms are discarded, not replayed. 1x/5x/20x/Observer Pace only influence the authoritative snapshots already produced by the coordinator, not scheduler clock. Hidden and paused freeze; resume creates no backlog.

A candidate is offered by A05-A catalog. At every 8000ms window, the scheduler examines live candidate eligibility, sorts by **least-started category**, then definition priority, type and anchor key. It attempts at most one successful start. An ID is marked attempted only when started, and may never start again within its canonical tick, even after its duration/cooldown; the set clears at tick boundaries. The candidate space is bounded by A05-A catalog, and the started-ID set is capped at 32 per tick. No independent timer, Math.random or Date.now.

A05-A session enforces maximum four active, one per anchor, 128 cooldown keys. End/cancel call finishAmbient and discard descriptor/route reference. Same-tick imported world replacement, new seed and scene shutdown reset all presentation state. The new `activeActors` descriptors expose ID, type, category, real anchor, start/deadline, reason, camera forecast, and optional contiguous cart route for A05-C, but **do not represent rendered Phaser objects**.

Observed rain-ending records only an actual consecutive `rain -> non-rain` authoritative snapshot transition. Skipped intermediate snapshots cannot prove one. History expires after two ticks and is never saved. The E04-D puddle index uses seeded ground plan positions; E04-D's post-rain wet-ground *rendering persistence* is not changed here and remains a Plan 04/A05-C integration limitation.

Camera visibility is sampled as a forecast on start and never influences gameplay. Offscreen actors have no sprites yet, so visibility metrics are not proof of visual appearance. Moving candidate events are suppressed under reduced motion, while static and audio descriptors retain eligibility (audio remains unimplemented until A05-D).
