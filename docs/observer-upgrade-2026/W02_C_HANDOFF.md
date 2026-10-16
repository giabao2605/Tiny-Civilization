# W02-C — Handoff to W02-D, and explicit W02-E gates

**Branch:** `feat/w02-c-96-world-generator` from main `bd0e3891`. No self-merge. **Verification:** PENDING final PR HEAD CI at documentation authoring.

## W02-D may assume

- `createWorld96(seed, population)` deterministically returns 96×96 `World96State` with `map: {width:96,height:96}`; all site/resource/NPC/household IDs and home/work/market ownership are consistent.
- Real zones: residential west (five 5-home streets), civic/market center, forested eastern waterfront with two lakes. Main connector streets + civic spine + nature service lane are `Terrain='road'`, and the real BFS proves every functional endpoint is reachable.
- One market, one commons, five work sites, twenty-five homes (capacity100), and existing 2/5/9 fields and 2/2/4 forest nodes by supported population. The initial ownership model is not replaced.
- `validateWorld96` is the generation acceptance gate. Keep it deterministic, introduce any future metadata validation separately, and test 10 seeded maps × 3 populations after every added POI or road treatment.

## W02-D still owns

- Road subtypes/hierarchy, entrances, ≥20 stable decorative POI/event anchors and visual treatment, without minting extra economic `SiteKind` entities or stocks.
- Explicitly testing ≥2 alternative main-hub access routes and meaningful map screenshots. W02-C proves reachability, not road hierarchy resiliency.
- Avoid blocking the existing player-facing v5 app and avoid enabling v6 serialization.

## W02-E remains mandatory before playable 96

1. Strict v5→v6 migration preserving true 48×48 world coordinates and the original frozen save; v6 parser/export/roundtrip, checks and migration tests.
2. Width-aware runtime type/geometry propagation in engine, social/economy functions and 96-specific construction plot selection, without touching v5 determinism.
3. Wire `createWorld96` into an explicit new-world selection/default path **only after** safe v6 serialization. There is no current production call to it.
4. Ensure renderer/camera and save limit work at true 96 size, and add real 96 simulation/persistence/E2E smoke tests; test existing 48 saves and invalid imports atomically.
5. Keep `WorldState` v5 and `World96State` v6 separated until the versioned type/validator architecture is ready. Never spoof `schemaVersion:5` for 96 tiles.

## W02-F / open issues

Physical Windows 20/50/100 FPS and 60–120 min GPU/heap soak remain not run; do not infer 60 FPS from Node generation timings or Chromium CI. The temporary v5 bootstrap in W02-C is a valid correctness tradeoff; consider optimizing only with an equivalent, regression-tested initialization builder. No multiplayer/backend/mobile/cloud deployment planned.
