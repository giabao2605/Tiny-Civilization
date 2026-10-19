# E04-D to E04-E Handoff (conditional)

Baseline: E04-C PR #31 merged at 972bf33b41cfa855fb79f1fd13bffd56d624d996; post-merge CI #39220531182 success with exact SHA.

E04-D owns visuals only. WorldStateV6.weather is authoritative; E04-D reads snapshot kind/intensity without writing simulation. WeatherLayer provides 112 budgeted camera-visible droplets plus wet roads, sparse puddles, lake ripples, cloud shadows and layered fog; it does not alter NPC schedules, navigation, weather RNG, economic RNG or existing save formats. E04-B lamps remain visible above fog/grade.

**Required before E04-E:** E04-D final PR Fast CI success on exact SHA, frozen fixtures green, manual screenshots 48/96 and night weather accepted, particle OFF differentiation verified, pan/follow/zoom/resize/restart and reduced-motion inspected, no blocking regression, PR merged by merge commit and post-merge CI verified. If visual QA remains PARTIAL, remain in E04-D and do not merge.

When gate passes, E04-E may add shelter/umbrella/NPC reactions and basic audio using existing pathfinding/POIs, preserving emergency needs, route fallback, transactions, save determinism and browser audio unlock policy. Do not implement E04-F, Plan 05, seasons, storm/flood/snow, Android, backend or deployment.