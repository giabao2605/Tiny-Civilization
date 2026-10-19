# E04-D Visual QA Matrix

## Known weather seed fixtures
A new v6 96x96 world at tick 0 starts as:
- Seed 2: clear.
- Seed 3: cloudy.
- Seed 1: rain.
- Seed 8: fog.

Each authoritative initial weather state persists at least 24 game ticks. These are reproducible state fixtures, **not screenshots**. At new-world seed entry, let canonical hours progress to the target (06:00, 12:00, 18:00 or 23:00), then pause and capture. For 48x48, import actual historical v5/old v6 save and record its migrated current weather; do not assume its weather began at tick 0.

## Mandatory live acceptance
Capture clear/cloudy/rain/fog at 48x48 and 96x96 with seed, tick, weather kind/intensity, viewport, NPC count and camera recorded. Prioritize 1366x768, 1920x1080 and 2560x1080; sunrise clear at 06:00, midday rain at 12:00, dusk cloudy at 18:00, night fog/rain at 23:00. Check original ArtKit palette, distinct cloudy/fog gradients, wet roads anchored when pan/zoom, NPC/roads visible, stable night window/street lights, and no UI overlays.

Open the Vite localhost URL with ?weatherParticles=off (development-only), or call WorldScene.setWeatherParticlesEnabled(false) via a scene debugger and repeat rain, fog, cloudy/clear at the **same** snapshot to verify non-particle recognition. Check pause/resume, 1x/5x/20x, Observer Pace 5/10/15 minutes per day, hidden tab, fit/follow/pan/zoom, resize, 20/50/100 NPC, legacy v5/v6 import, reset, reduced motion and scene restart without leaked objects/textures.

## Evidence ledger
| Gate | Status |
| --- | --- |
| Pure-unit visual preset and RNG/world invariants | Pending exact-head Fast CI |
| Existing simulation, save, fixture and movement regression | Pending exact-head Fast CI |
| Four weather kinds x both world sizes screenshots | NOT VERIFIED |
| Night rain/fog, particle OFF, camera/lifecycle visuals | NOT VERIFIED |
| Physical PC FPS/GPU/heap and soak | NOT MEASURED |
| Manual Full E2E / Pages | NOT RUN (optional, not dispatched) |

**VISUAL QA PARTIAL. AUTO-MERGE BLOCKED.** Automated tests are insufficient to establish artistic acceptance.