# W02-F — Three-District Visual QA (Real Phaser)

**Status:** W02-E pre-polish screenshots **INSPECTED**; W02-F after-polish screenshots **PENDING**. Not a Windows GPU certification.

## Before: real 96×96 app screenshots, seed 12345

From [post-merge W02-E CI #38995262805, artifact 12087561255](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38995262805/artifacts/12087561255), captured by `tests/e2e/observer-w02-e-production.spec.ts` on actual React/Phaser canvas, desktop viewport 1366×768. Not W02-D's isolated SVG harness.

- `observer-w02-e-evidence/w02-e-96-overview.png`: full map clearly exposes residential western grid, central plaza/market and water in eastern district.
- `.../w02-e-96-residential-follow-npc.png`: streets and house roofs distinguishable, but many grassy inter-block lots feel repetitive.
- `.../w02-e-96-civic-market.png`: civic plaza has visible market/worksites and surrounding roads; underdetailed open grass is the principal polish target.
- `.../w02-e-96-nature-waterfront.png`: two lakes, continuous shore and darker trees distinguish this district; water does not visually appear paved across.
- `.../w02-e-48-after-migration.png`: old 48×48 world remains visually distinct and remains 48 after import.

Visual judgment is limited to captured frames, not an on-device human playtest. Entrance markers are very small at Fit, though visible in close-up; keeping them under NPCs makes route markers less intrusive. No fabricated screenshot claims.

## W02-F polish

Small decorative courtyard flowers/ground patches, civic paving accents and eastern reed tufts are emitted from a stable `visualHash(seed, x, y, 91)` into a single static Graphics layer. Only existing walkable grass is eligible. All functional site tiles, resource tiles, POIs, entrances and road tiles are reserved. No new `Site`, `ResourceNode`, road, path cost or RNG state. Static entrance batching preserves highlights; NPC labels appear only at inspecting zoom.

## After: pending real screenshot matrix

`tests/e2e/observer-w02-f-visual.spec.ts` creates actual canvas screenshots (not full-page huge layout or vector generator): `w02-f-96-overview.png`, `w02-f-96-residential.png`, `w02-f-96-civic-market.png`, `w02-f-96-waterfront.png`, `w02-f-96-ultrawide.png`, `w02-f-96-small.png`.

Must inspect corresponding CI artifact, visually compare with the above W02-E frames, verify no overlapping fake road/water/entrance/NPC and check browser console/page errors. **Until artifacts exist and are visually inspected, AFTER QA: NOT RUN**. Manual PC review remains OPEN.
