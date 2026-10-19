# E04-E Behavior QA Matrix

## Automated scenarios
- Deterministic intensity-dependent subset; no second RNG stream.
- Rain eligible during discretionary/outdoor scheduling, priority above leisure but below emergencies, trade/build and active harvest.
- No shelter in clear/cloudy/fog or in historical frozen v5.
- Owned home goal + existing routing, movement adjacency, currency conservation.
- Unreachable home recovery without teleport or unbounded retries.
- Existing simulation replay, save migration and golden fixture suite via Fast CI.

All status markers below are pending validation until final-head CI is confirmed.

## Live visual acceptance checklist
1. Test 96×96 seeds 1 (rain), 2 (clear), 3 (cloudy), 8 (fog) at 20, 50, 100 NPC.
2. Advance seed-1 rain to 18:00 and inspect adult shelter cohort: `Trú mưa` reason, actual owned home and legal route, alongside citizens that continue essential activities.
3. Verify some outdoor activity decreases, without every NPC running in formation.
4. Advance across rain end and look for NPCs resuming normal work/social/rest routines; no stuck shelter explanation.
5. Disable particles with `?weatherParticles=off`, verify visual/readability and weather label.
6. Import historical v5/v6 48×48 save: **automatic shelter not enabled** by ADR, visuals/weather remain.
7. Verify no teleport, no routing storms, no missing economy/social/governance interactions, console errors or leaks through resets.

**MANUAL QA NOT RUN on this branch yet.** Real FPS, route counts, heap and screenshots NOT MEASURED. Full Plan 04 NPC reactions on 48×48 remain a gap, so do not mark that requirement passed.
