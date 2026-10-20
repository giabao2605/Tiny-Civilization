# E04-F — Visual and audio QA

## Chromium visual evidence (implemented, NOT RUN)

`tests/e2e/e04f-integration.spec.ts` opens the **real Phaser canvas** in Chromium and plans 24 PNG files: 48×48 migrated v5 and 96×96 v6, seed 2 clear at 06:00, seed 1 rain at 12:00, seed 3 cloudy at 18:00, seed 8 fog at 23:00, each in 1366×768, 1920×1080 and 2560×1080 viewports. The dev-only `weatherParticles=off` flag helps show whether rain/fog/cloud remain identifiable by grade/ground alone. A second browser case screenshots 100-NPC follow and reduced motion.

**Screenshot capture is not visual acceptance.** A human must actually open the PNGs and inspect dawn/day/dusk/night, rain at night, wet ground, fog readability, lighting, NPC/site visibility and scene resize. The 24-image grid intentionally samples one weather kind per hour and does not exhaust all 16 hour×weather combinations; nighttime rain and clear daytime are still **PARTIAL** until directly inspected.

## Audio tests (manual evidence NOT RUN)

1. Cold page load: no AudioContext creation or sound before a user gesture. Check browser autoplay errors.
2. Enable audio by button click and check unlock succeeds where supported; capture user-visible status. Compare rain/clear and subsequent real weather transitions by ear.
3. Move volume 0/50/100, mute/unmute repeatedly, check pause and hidden tab silence.
4. After returning to visible tab, switching 1×/5×/20×/Observer Pace, importing a world and remounting canvas, verify there is no double audio or zombie AudioContext.
5. Reload and verify the next session requires a user gesture. Record Windows audio device and browser version.

Existing `WeatherAudio` pure tests cover gain clamps, mute/pause/hidden calculation, deferred AudioContext construction and idempotent destroy. The added Chromium integration checks UI controls, not the sound physically reaching the listener. **No claim of real audible success** is allowed until the operator listens.

## Status

- Headless screenshot capture: **NOT RUN**.
- Human visual review: **NOT RUN**.
- Physical audio and browser lifecycle: **NOT RUN**.
- Hardware FPS / screenshot smoothness: **NOT MEASURED**.
- Owner earlier reported E04-E gameplay acceptable on PC; that is **not E04-F visual/audio evidence**.
