# A05-D — Audio Architecture

\`\`\`text
React/App (sole WeatherAudio owner; UI controls/gesture unlock)
  ├── Web AudioContext (created only on gesture)
  │     └── master GainNode
  │           ├── ambience bus -> 2 existing procedural loops -> rain/day/night mix
  │           └── SFX bus -> up to 4 bounded oscillator envelopes -> spatial gain/pan
  └── AmbientAudioBridge (stable callbacks, no React re-render per sound)
         ↑ WorldScene.setSnapshot → AmbientDirector.reconcile → cancelled by ID
         ↑ WorldScene.update → AmbientDirector.advance → started/ended by ID
         ↑ WorldScene.update (≤10Hz) → Phaser camera.worldView (world pixels)
         ↑ WorldScene shutdown → resetEvents
\`\`\`

\`soundModel.ts\` clamps levels and projects real tile centers using \`TILE_PIXELS\`. Attenuation uses the current camera worldView dimensions, already accounting for zoom; pan is bounded [-1,1], invalid view/coordinates yield zero, and offscreen one-shots with negligible gain are skipped immediately, never queued. Existing playing sounds can fade spatial gain and pan at 0.12s camera updates; no new sound nodes for camera changes.

Only actual \`started\` transitions may consume an ID. No SFX spawns from a React render or sprite drawing. The controller copies a small tile coordinate, never retains the world object, and stores a bounded seen-ID set for replay suppression. For \`ended/cancelled\`, an ID alone suffices; cleanup removes oscillator nodes. A voice also self-releases after its oscillator envelopes end. A missing descriptor on \`started\` is ignored safely.

\`unlock()\` catches browser policy errors, preserves a single context and allows a later user gesture retry. Mute, pause or tab hidden releases SFX and retargets master/ambient gain; resume never catches up historical events. Context closing is idempotent on React unmount. Scene restart **does not** close the shared context, but always releases scene-owned voices and IDs.

**Read-only diagnostics:** context state, 0..4 active one-shots, two ambient loop sources after unlock, cumulative created/released counters, duplicate/budget suppression and unlock failures. They are not WorldState fields.

**A05-D limitations:** The minimal procedural sound palette is not realistic recorded foley. Timbral acceptance, browser interaction and long PC listening sessions remain an explicit manual QA gate.
