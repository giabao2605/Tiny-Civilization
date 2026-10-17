# W02-E — Production Phaser visual QA

**Status:** tests and CI artifact wiring added; actual screenshots require successful browser execution.

## E2E production evidence

tests/e2e/observer-w02-e-production.spec.ts opens the real React/Phaser app and checks 96×96 world metadata, actual canvas, three districts, 32 entrances, 24 POIs, camera Fit/Follow/Reset/zoom/pan, NPC running, v6 export/restore, legacy v5 import as 48×48 and malformed import rollback. Screenshots use the w02-e- prefix and are captured from real production gameplay, NOT the isolated W02-D SVG harness.

Screenshots requested: 96-overview, 96-residential-follow-npc, 96-civic-market, 96-nature-waterfront, 96-road-entrances-pois, 96-save-load, 96-npc-moving and 48-after-migration. The CI workflow collects these images into observer-w02-e-evidence in the phase-07-release-evidence artifact before production smoke clears test-results.

## Camera and scene

Map dimensions are sourced from world.map for schema 6, implicit 48×48 only for legacy schema 5. Camera and canvas remount on save/load, fit/reset/follow remain available, road/POI marks do not become clickable economic locations, and NPC sprites remain independently selectable. Read screenshot artifacts and console/browser errors after CI before certifying visual correctness.

Chromium CI is not Windows hardware certification. No unverified 60 FPS claim.