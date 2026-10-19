# E04-E Audio QA Matrix

## Automated checks
- `ambientLevels` yields silence when disabled/muted, paused, hidden or volume zero.
- Four weather presets target rain/wind mix with clamped valid gain.
- `WeatherAudio` construction does not initialize AudioContext; unavailable API gracefully declines.
- `destroy` is idempotent and prevents a later unlock.

## Required PC/browser checks (pending)
1. Page load without touching controls: no sound; no autoplay errors.
2. Enable with button: browser unlocks sound after user gesture.
3. Test seeds 1 rain vs 2 clear, then actual rain/cloud/fog transitions; listen for smooth 0.75s ramps.
4. Test mute/unmute and volume 0/50/100 repeatedly, including quick toggles and rejection.
5. Test paused world, hidden tab, return to page, 1×/5×/20×, Observer Pace, import world and remount Phaser scene.
6. Reload page: audio requires gesture again, no ghost playing audio.
7. Inspect memory/listeners/AudioNodes and long-running 96×96 100 NPC.

**AUDIO MANUAL QA NOT RUN; physical speakers/headphones NOT VERIFIED.** Browser/API audio behavior in user environment cannot be inferred from pure tests; this is a merge gate.
