# Q07-A technical test matrix

All cases log exact SHA, fixture ID, seed, population, map, start/end tick, speed, command sequence, expected vs actual, run command and hardware. **Planned, not executed** unless Q07_A_TEST_EVIDENCE says otherwise.

## Simulation (Q07-B)

| IDs | Inputs / procedure | Oracle |
|---|---|---|
| SIM-01/02 | same seed + ordered commands + N ticks twice; 48×48 and 96×96 | identical state digest, events and stable citizen IDs; independent RNG streams |
| SIM-03/04 | pause, 1×/5×/20×; change tab visibility | paused tick 0; no skipped sim ticks, no hidden catch-up; 1 tick = one hour |
| SIM-05/06 | market buy/sell, food/wood transfers, household/social interactions | wallet/inventory/market stock conservation, stable references |
| SIM-07/08 | governance queued commands & nextRequestId; clear/cloudy/rain/fog weather transitions | deterministic command result; weather PRNG never advances economic PRNG |
| SIM-09/10 | weighted path across roads/grass; water barrier + unreachable target | finite fallback, no teleport, no infinite retry, reproducible path |

## Save (Q07-B/E)

| IDs | Procedure | Oracle |
|---|---|---|
| SAVE-01/02/03 | parse genuine legacy v5 format 1; historical pre-weather v6 format 2; weather v6 format 3 | format-specific schema; v5 migrated remains 48×48, never silently resized |
| SAVE-04/05 | malformed JSON, >8 MiB payload | reject before state replacement with actionable error |
| SAVE-06/07 | dangling entity references, localStorage quota error | validation failure atomic, live state unchanged |
| SAVE-08/09 | pending commands and nextRequestId; current export-import replay | retained command ordering/IDs; same canonical state and next ticks |
| SAVE-10 | frozen 12 SHA-256 checkpoint replay | byte/state digest matches committed expected JSON; no hash updates |

## Presentation (Q07-B/C, PC manual)

| IDs | Procedure | Evidence |
|---|---|---|
| UI-01 | 1366×768, 1920×1080, 3440×1440 | screenshots and console errors, same seed/tick |
| UI-02 | Fit/Reset/Follow/Zoom/Pan, selected NPC dying/reset, AFK override | screencast and target/click consistency after resize |
| UI-03 | 06h dawn, 12h day, 18h dusk, 23h night; hide HUD | 4 labeled screenshots and reviewer contrast assessment |
| UI-04 | clear/cloudy/rain/fog, transition, post-rain puddle | visual captures with particles off and on |
| UI-05 | ambient events & audio mute/unmute and locked autoplay | event timeline/audio observed; no duplicate sources |
| UI-06 | reduced motion, remount canvas, scene cleanup | actual DOM/canvas resource and listener lifecycle |

## Watchability (Q07-D)

30 **real** seconds: capture sign-of-life, not a generated claim. Five **real** minutes: annotate each rendered candidate with categorical key and source (`simulation` / `decorative`) and count *distinct keys*, not event occurrences. Fixture may use a synthetic presentation clock (`virtualMs`) for deterministic candidates; it does **not** satisfy five-minute human viewing criterion. Run 20–30 **real** minutes on observer fixture plus two naturally generated seeds; note transitions, idle gaps, repeated categories, user interactions and visible world changes. Preserve original event logs and video timestamps; don't mutate money/food/relations to force an event.

## Performance and reliability (Q07-E)

Same machine/browser/version and seed/tick: 48/96 maps, 20/50/100 NPC, 200 **synthetic only** if harness permits; three PC viewports. Sample FPS median, frame-time p95, sim tick p95, path calls/tick, resource/texture and audio-source count; heap at 0/15/60 minutes; save bytes/load latency. Perform repeated reset/save/load with error monitoring. Soak 60–120min is optional for Q07-A merge and remains NOT RUN; no 60 FPS or leak-free claim without hardware trace.
