# W02-E — Handoff and gate to W02-F

**PR:** https://github.com/giabao2605/Tiny-Civilization/pull/20. **Status:** DRAFT / PENDING FINAL QA; no self-merge.

## Proposed locked contracts once CI passes

- WorldState schema 5 is exact historical data; schema 6 owns dimensions and optional-only-on-48 layout (96 requires full deterministic metadata).
- Imported v5 worlds migrate to v6 with map 48×48; never enlarge, regenerate, silently fix or overwrite imported JSON.
- Export uses v6 format 2 sim-v6-map; exact v5 serialization remains possible for historical tests.
- World tiles are authoritative. Road kind and inert POIs are visual metadata, entrances refer to existing economic sites, original BFS semantics and all money/food/wood conservation rules remain.
- Default New Game 96×96 with 20/50/100 NPC; runtime paths use per-world dimensions.
- Gameplay target is local PC. GitHub Actions checks and optional existing Pages job do not constitute a new deployment requirement.

## W02-F ownership

Only after final W02-E verification: world-density/polish, rendering/culling profiling, FPS and heap memory, GPU and 60–120-minute Windows soak, hardware viewport matrix and any proven bottleneck. Do not begin Plan 03 (weighted A*) or Plan 04 weather from this PR.

## Release blockers

Any CI/test red, broken legacy SHA, non-atomic corrupt import, missing 96 production screenshot, invalid construction entrance, or economic conservation violation blocks VERIFIED. Pending status must be reported rather than claiming DONE.