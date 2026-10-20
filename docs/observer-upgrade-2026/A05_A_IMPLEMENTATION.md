# A05-A — Implementation and reuse inventory

**Baseline:** `main@bd43ed2dc81e252400ef055c3f19bd413ad80973`; E04-F PR #34 merged, post-merge Fast CI #39355971369 SUCCESS. **Scope:** only Event Taxonomy & Instrumentation. PR #35, no main merge.

| Existing system | Actual source | Reuse / strict boundary |
|---|---|---|
| Causal WorldEvent, capped history, event IDs | `src/sim/world.ts`, `engine.ts`, `balance.ts` | Never add fake gameplay timeline events or allocate numeric IDs |
| Social encounter, leisure/event POIs | `src/sim/social.ts`, `leisure.ts` | Read living NPC positions/activity; no fake affinity or interactions |
| Event timeline filter & inspector | `src/app/App.tsx` | Unchanged, causal history only |
| 96 district/POI/road hierarchy | `src/sim/world96Layout.ts` | Read `districts`, `roads`, `pois`; decorative POI is NOT a market/site |
| Legacy 48 map and v6 migration | `src/sim/world.ts`, `src/persistence/save.ts` | Only real sites and original road tiles; no fake 96 hierarchy |
| Canonical hourly clock & weather | `src/sim/clock.ts`, `weather.ts`, `weatherShelter.ts` | Read hour, weather, real NPC `Trú mưa` reason only; no RNG/tick writes |
| Rendering, lighting, camera AFK | `WorldScene.ts`, `render/lighting.ts`, `camera/afkDirector.ts` | Future integration; do not duplicate Plan 04 window lights |
| Phaser lifecycle and weather audio | `WorldScene.ts`, `audio/weatherAudio.ts` | Future A05-B/D integration, no new timer/audio now |

**New code:**
- `src/game/ambient/types.ts`: cosmetic discriminant and typed anchor/candidate contracts.
- `catalog.ts`: declarative 11-entry catalog, pure time/weather-eligible candidate selection, runtime input validation.
- `anchors.ts`: index actual site, road and POI anchors; revalidate coordinates, occupancy, real NPC pairs. Build on world change, not on each render frame.
- `runtime.ts`: manual in-memory budget/cooldown, start/end/cancel/reset and counters; **NOT** an automatic scheduler.
- `ambient.test.ts`: contract/weather/map/population/virtual-time/replay/budget tests.

**Do not confuse candidate with rendered event.** Window lights remain with E04-B. A05-A does not introduce animation, audio, new WorldState/save fields, event bus, Redux, Worker or dependency. All existing gameplay, camera and audio behavior remains unchanged.
