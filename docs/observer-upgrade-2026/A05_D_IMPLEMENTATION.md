# A05-D — Ambient Audio & Localized Sound Effects (2026-10-20)

**Baseline:** main@245739180c2fc510c22b3c32970a29e8926c94e8; A05-C PR #37 merged; post-merge Fast CI #39366800211 SUCCESS.
**Branch:** feat/a05-d-ambient-audio. **Scope:** local PC observer presentation; no GitHub Pages or gameplay state changes.

## Implementation
- Extended E04-E \`WeatherAudio\` instead of creating a second \`AudioContext\`. There is one master, one ambient/weather bus (existing rain/outdoors loops) and one SFX bus. Graph is created only by a gesture-driven \`unlock()\`.
- The outdoor sound mix now changes with the canonical hour from \`WorldState.tick % 24\` and the existing weather kind/intensity. Night/dusk are quieter; rain remains a single bounded procedural voice. Existing E04-E API and tests are preserved.
- Added pure \`soundModel.ts\` for world-pixel attenuation, stereo balance, clamping and a conservative SFX catalog. Supported short procedural cues: birds/puddle, cart wheel/wood, market opening/closing, civic bell, roof drip. Pets, chimney smoke and plaza gestures intentionally do not synthesize chatter.
- \`WorldScene\` forwards actual \`AmbientDirector.advance/reconcile\` transitions and active descriptors via \`AmbientAudioBridge\`; it does **not** infer starts from visual registry. The bridge also sends camera worldView at ≤10Hz; bell-hour has no visual dependency.
- On ended/cancelled transitions, voices release by ID without needing a descriptor. A capped seen-ID set prevents one-shots playing again during rerender, resume or repeated dispatch.
- Pause/hidden/mute/master-zero stop live one-shots and fade the soundscape. Scene shutdown, seed reset, save import and React unmount clear the correct audio resources. Existing controller survives scene restart but no voices/IDs do.
- UI retains the existing toggle and volume test ID; adds compact independently adjustable ambient and SFX sliders. Preferences are React-only and not serialized.

## Constraints
- At most two permanent environmental buffer sources and four simultaneous SFX voice envelopes, with a bounded list of 192 seen IDs; no timers for cues or source creation per render frame.
- Native Web Audio generated tones: **no external audio assets, licenses or attribution**.
- Sound effects are deliberately minimal procedural cues. **Real speaker/headphone listening acceptance is NOT RUN**; headless tests cannot certify timbre/comfort.
- The A05-D overlay/mixer has no connection to \`WorldState\` mutation, simulation RNG, save schema or economic event feed.

See architecture, audio QA, lifecycle QA and A05-E handoff in adjacent files.
