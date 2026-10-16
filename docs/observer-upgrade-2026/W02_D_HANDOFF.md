# W02-D — Handoff for W02-E

**Branch:** feat/w02-d-road-entrances-pois. **PR:** #19 (draft). **Status:** PENDING final-HEAD CI, no merge performed.

## W02-D contract

- New 96-only world shape extends runtime schemaVersion:6 / map width=96,height=96 with layout: districts, roads, entrances and POIs. Layout is plain JSON metadata with a deterministic validator.
- Four road kinds annotate real terrain road cells. No path costs or algorithm change. Real grass/forest/water walkability remains unchanged.
- Entrances are separate road cells referring to existing site IDs; they are not a substitute for current game destinations. Event POIs are inert future anchors, never economic SiteKind, money or inventory.
- 24 seed-stable POIs across three districts; two road-only backup fixture routes. Test harness PNGs are not production gameplay screenshots.

## Mandatory W02-E steps

1. Introduce strict v6 parser/export and v5→v6 migration preserving legacy 48×48 map, old full-world projection, PRNG, pending commands, IDs and economy. Keep original v5 import unchanged.
2. Propagate dimension-aware types through runtime engine/economy/household/construction plot selection before any 96 world advances a tick. **Never cast v6 to v5**.
3. Safely render 96 layout road kinds, POI accents and site entrances in production Phaser, keeping NPC feet and click hitboxes visible. Verify overlapping building overhangs visually.
4. Add true playable 96 and roundtrip save/browser tests, hostile JSON rejection, camera Fit/Follow across 96, resource balances and memory checks.
5. Compare actual UTF-8 save bytes with 8 MiB cap and preserve atomic import rollback.
6. Replace harness-only evidence with production 96 gameplay screenshots after migration is safe.

## Later work

W02-F handles hardware FPS, GPU/heap soak and performance. Plan 03 owns weighted routes, Plan 04 day/night/weather, Plan 05 ambient/audio. No cloud, multiplayer, Android or new economy.
