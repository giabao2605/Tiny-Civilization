# A05-D — Audio QA (2026-10-20)

Legend: **PASS / FAIL / PARTIAL / NOT RUN / NOT MEASURED**. Do not equate unit tests with real audio output.

| Test area | Evidence | Status |
| --- | --- | --- |
| Pure volume clamp, invalid coordinates, world-space attenuation/pan | \`soundModel.test.ts\` | NOT RUN (awaiting Fast CI) |
| Canonical daytime/nighttime/rain/weather levels | \`ambientAudio.test.ts\`, \`weatherAudio.test.ts\` | NOT RUN (awaiting Fast CI) |
| Autoplay policy / same AudioContext / unlock rejection | Fake Web AudioContext tests | NOT RUN (awaiting Fast CI) |
| Real director transition → bounded sound; audio-only bell without visual | Integration via fixture + mocked AudioContext | NOT RUN (awaiting Fast CI) |
| Repeat event ID and start/end/cancel cleanup | Mock lifecycle tests | NOT RUN (awaiting Fast CI) |
| Pause, hidden, mute, restart and no backlog | Unit test + source wiring; browser follow-up required | PARTIAL |
| 48x48 v5 and migrated v6, native 96x96, 20/50/100 NPC | Existing director + fixture regression plus source adapter; no full acoustic matrix | PARTIAL |
| 1x/5x/20x, observer pace 5/10/15, camera pan/zoom/follow/AFK | Canonical scheduler unchanged; camera worldView bridge; manual testing required | PARTIAL |
| Physical PC sound output, timbre, comfort and loudness | No real speaker/headphone audition | NOT RUN |
| Chromium E2E visual/audio interaction, autoplay denied | No browser run in current environment | NOT RUN |
| Measured FPS, CPU, graph growth, sustained memory / 60-120 min soak | No benchmark traces | NOT MEASURED |
| Production dependency security, typecheck, lint, unit tests and build | Fast CI workflow on final PR head | NOT RUN (awaiting Fast CI) |

## Manual PC acceptance checklist
1. Cold load: inspect devtools for zero \`AudioContext\` before clicking audio.
2. Enable from a click; inspect context state and audible low-volume outdoor, rain and bell/bird cues. Try blocked autoplay and disabled Web Audio.
3. Set master/ambient/SFX sliders to 0, 50 and 100; rapidly mute/unmute with no crackle, doubled layers or speaker spikes.
4. Compare 06:00/12:00/18:00/23:00 with clear/cloudy/rain/fog; pan/zoom/follow/AFK from audible into inaudible distances.
5. Pause/unpause, hide/foreground, run 1×/5×/20× and Observer Pace 5/10/15: no deferred bells, no sped-up sound.
6. Reset seed, import v5/v6 save, restart canvas repeatedly: inspect voices/context count and browser console.
7. Observe at least 30s and 5min on 48x48 and 96x96 with 20/50/100 NPC; record actual sound quality and resource traces.

No headphone/speaker listening, browser autoplay screenshot, or performance claim is made here.
