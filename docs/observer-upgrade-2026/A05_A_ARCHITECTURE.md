# A05-A — Causal/cosmetic separation ADR

**Causal gameplay:** `src/sim/engine.ts` emits numeric-ID `WorldEvent` on the canonical hourly simulation tick. Causal events may legally alter economic, social or governance values, are saved/replayed and displayed in the event timeline. They cannot be created by the renderer.

**Cosmetic ambient:** `AmbientCandidate` is discriminated by `layer:'cosmetic'`; its IDs have prefix `ambient:` and contain event type, anchor key and canonical tick. It is *presentation-only* and never enters WorldState, the gameplay event feed, save schema or simulation PRNG. Promotion to gameplay requires a new rule in the engine and independent deterministic tests.

```text
WorldState (read only) -> buildAmbientAnchorIndex (load/topology change)
 -> ambientCandidates(world, index, {virtualMs, rainEndedTick?})
 -> tryStartAmbient(session, world, candidate, nowMs) [manual, bounded]
 -> finishAmbient(session, id, nowMs, cancelled?) / resetAmbientSession
                     |
              A05-B/C/D future renderer/audio
```

No Math.random, Date.now, RNG draws or independent game timer in candidate selection. Site/road/POI index is generated once per world/topology replacement rather than per render frame. A05-B **must revalidate** moving citizen/pair anchors when starting, reset on save-load/seed/scene shutdown, distinguish schedule from visibility and never move NPCs to fit vignettes. 48×48 migrated maps have actual roads/sites but no authoritative 96 POI/district metadata.

`AMBIENT_LIMITS` defaults: maxActive=4, maxPerAnchor=1, maxCooldownEntries=128. Manual primitives reject invalid, duplicate, anchor-busy, global budget, cooldown and expired events. An explicit `finishAmbient` releases actor references, records per-type/anchor cooldown and counts end/cancel. A reset clears active, cooldowns and instrumentation. Metrics: candidate, scheduled, started/ended/cancelled, active/peak, invalid anchor, budget/cooldown/duplicate suppression, visible/offscreen and per-category starts. These are developer presentation counters, not gameplay or analytics service.

A05-A intentionally does not integrate with Phaser, render sprites or play sound: lifecycle integration will be tested in A05-B; visual route and z-order in A05-C; WebAudio unlock/mute in A05-D; soak and watchability profiling in A05-E.
