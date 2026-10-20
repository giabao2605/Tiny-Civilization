# A05-A → A05-B: implementation handoff

**Entry:** check owner-approved PR #35 merge and exact latest `main`/CI before branching. Read Plan 05, Simulation Contract, A05-A code/QA and E04-F handoff. Never assume merge occurred.

**Available APIs:** `buildAmbientAnchorIndex(world)`; `ambientCandidates(world, index, {virtualMs, rainEndedTick?})`; `isAmbientAnchorValid(world,anchor)`; `isAmbientCandidate(world,unknown)`; `AMBIENT_CATALOG`; `AMBIENT_LIMITS`; `createAmbientSession`; `tryStartAmbient`; `finishAmbient`; `resetAmbientSession`; `noteAmbientCandidates`; `noteAmbientVisibility`; `getAmbientMetrics`.

**Implementation checklist A05-B:**
1. One deterministic presentation director attached to scene/coordinator lifecycle, never a new canonical game clock. Virtual presentation elapsed, no re-render-triggered repeat starts.
2. Revalidate anchors and living actor co-location when starting, not just at index construction. Index once per world replacement; reset director on seed reset, save import, scene shutdown and geometry change.
3. End/cancel/cleanup every cosmetic actor, cap active global/per-anchor and cooldown records. Suppress offscreen render without modifying world behavior. Handle pause/hidden/reduced motion.
4. Cart requires contiguous walkable **road route** before A05-C draws it; anchor validity alone is insufficient. 48×48 does not have a known `main` road. Do not add fake NPCs to world.citizens.
5. `puddle-bird` needs real observed rain-end context; current WeatherState does not store previous weather. Never infer it merely from clear weather.
6. Use seeded fixtures to test 30s/5min **after** A05-B/C live actors exist, then browser/PC validation in E. Keep tests and evidence explicit.

**Forbidden:** add ambient to `WorldEvent` timeline, allocate numeric citizen/event IDs, mutate gameplay from renderer, add cosmetic save version, auto-merge or GitHub Pages deploy.
