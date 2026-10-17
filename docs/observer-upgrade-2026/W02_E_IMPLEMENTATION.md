# W02-E — Implementation record

**Branch:** feat/w02-e-v6-runtime-persistence. **PR:** #20 (Draft, NOT VERIFIED). **Base:** 00702be2d71bd062c95c6ad6ab2769cda5a84109.

## Runtime contract

WorldState is now a discriminated union: an exact LegacyWorldState schema 5 without dimensions and WorldStateV6 schema 6 with explicit map width and height. Migrated 48×48 v6 worlds have no 96 layout. New v6 96×96 worlds require districts, road hierarchy, entrances and inert decorative POIs. The terrain array remains authoritative. Legacy createWorld still returns schema 5; createWorld96 returns schema 6. There is no mutable global map stride or tile-count inference.

The simulation uses the same hourly tick, RNG progression, social/economy/governance functions and BFS. Type overloads on advanceOneTick and advanceTicks preserve static legacy return types. New Game uses createWorld96 for 20/50/100 NPCs; isolated test fixtures may deliberately bootstrap legacy worlds. Loading an old save never resizes terrain. React coordinator validates import before changing snapshot, pending commands, request IDs, timer or localStorage. New Game retains its confirm-before-reset behavior.

For 96×96 housing, candidate plots are deterministically scanned near existing roads. Road, water, economic sites, resource nodes, entrance cells and POIs are excluded. Construction uses original material/cash/time rules. On house completion the deterministic layout metadata is regenerated for the new Site. Phaser restarts scene when metadata changes, preserving gameplay geometry.

## Rendering contract

Existing Phaser WorldScene draws the 96 terrain; a new metadata pass draws main/side/footpath/plaza cells with distinct pixels, real site entrance markers and decorative POIs from existing art assets. No POI is a Site or economic source. Phaser camera reads world dimensions and resets for imported worlds and New Game; NPC selection and sprites continue using existing code. This is production rendering, not W02-D SVG harness.

## Exclusions and status

No A*, weather, audio, new economy formulas, multiplayer, backend or cloud deployment. W02-F still owns Windows GPU/heap/FPS soak and optimization. **Implementation landed in a draft PR; CI and browser proof are required before VERIFIED.**