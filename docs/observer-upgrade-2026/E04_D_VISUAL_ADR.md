# E04-D Visual ADR: render-only weather

Date: 2026-10-19. Source baseline main 972bf33b41cfa855fb79f1fd13bffd56d624d996; E04-C PR #31 merged; post-merge Fast CI #39220531182 completed successfully on that exact SHA.

## Decision
WorldStateV6.weather remains authoritative. No independent Phaser weather clock, simulation RNG, persistence or NPC effects. Historical v5 direct rendering remains clear; imported v5 becomes v6 through existing save migration. Pure weatherVisuals.ts maps current snapshot kind/intensity to cosmetic targets; WeatherLayer is one disposable Phaser scene-owned renderer. Color and alpha transition through one bounded approach function, no tween queues, no graphics allocations per frame.

## Render order
- Terrain 0, district roads 1, world-space wet roads and water ripple marks 2/3.
- Existing buildings/citizens are drawn at depths 100+.
- Slow cloud shadows 3750, weather color grade 3760, stratified fog 3790.
- Existing day/night ambient 3800 and emissive windows/lamps 3801/3802 remain unchanged.
- Camera-visible rain streaks 3803, never spawned across the entire map.

Fog is stylized horizontal world-space haze, not 3D depth or gameplay sight. Cloud shadows are decorative. World-space puddles do not move when the camera pans.

## Budgets and state
One fixed pool of 112 cosmetic particle descriptors (seeded by visualHash). Ground geometry is computed once per scene. Rain streaks redraw only inside the active camera view. No weather texture per frame, no extra game engine, no scheduled timer, no Math.random or draw from weather/economic RNG. All six Phaser render objects are destroyed on shutdown.

Pause/hidden/reduced-motion snap the visual target and suppress motion. A new canonical weather snapshot supersedes a prior unfinished render transition. Rain-on-ground may fade after rainfall via render-only alpha, but this history is not saved. Reload correctly reconstructs only saved current weather; no fabricated past precipitation.

## Rollback
Remove WeatherLayer integration and two weather render modules while retaining existing E04-B lighting and E04-C save/weather support. No new dependencies or deployment.