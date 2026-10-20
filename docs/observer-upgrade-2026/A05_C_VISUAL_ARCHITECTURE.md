# A05-C — Visual Architecture

```text
authoritative snapshot -> WorldScene.setSnapshot -> AmbientDirector.reconcile
                           -> AmbientVisuals.sync(activeActors) [release on cancel]
foreground frame      -> AmbientDirector.advance(delta, paused/hidden/reduced)
                       -> AmbientVisuals.sync(activeActors, presentationMs, camera, reducedMotion)
                           -> id-keyed registry -> Phaser container + one Graphics
scene SHUTDOWN         -> registry.clear/destroy(true), AmbientDirector.dispose()
```

A05-B schedules exactly once and owns eligibility, duration, cooldown, road preflight, NPC pair validation and weather cancel. A05-C uses active descriptors as lifecycle truth, never schedules new events. It is resilient if a transition is missed between React snapshots: the set reconciliation is idempotent and removes handles not in the director.

`ambientPoint` uses the director's 0..1 presentation clock. Cart coordinates interpolate **only** between adjacent Manhattan road tile centers; bad or absent route => no handle, no teleport. Bird pose has an enter/settle/hop/leave sequence; pet pose stays within ±3 pixels of the home center. No random draws or gameplay tick changes in animation.

The bounded registry creates at most one handle per active ID and destroys on end/cancel/culling/reset/shutdown. Pan/zoom/AFK can re-create a still-active actor once it becomes visible; cumulative creations are not an object-leak indicator, `createdVisuals - destroyedVisuals = renderedActors` is the instantaneous object-count invariant. At most four actors may render because A05-B limits active descriptors to four.

Static market, smoke and real citizen gesture remain valid under reduced motion, with fixed no-animated frame. Moving pet/cart/birds are omitted from graphics while reduced motion is requested; the director also suppresses new moving descriptors. Pause freezes presentationMs; hidden early-exits the scene update and director rejects hidden time, preventing catch-up. The adapter does not retain WorldState or live NPC objects across scene restart.

Depth uses base ground (0..), buildings/NPC (~100 + y), roof/market cues (~85 + y), overlays from Plan 04 (~3750..3803). Actor containers have no input handler, citizenId data or collision body. Existing weather, lighting and texture lifecycle are unchanged.
