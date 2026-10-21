# Q07-C visual QA matrix

Source inspection does not equal actual visual PASS. Screenshot comparisons must use the same seed, population, map dimensions and tick where applicable. Record image/video paths, actual OS/browser/GPU, and console errors; no artifact is fabricated.

| QA ID | Case / fixture | Reproducible method | Objective oracle | Status |
|---|---|---|---|---|
| QA-01 | Q07-normal-life / 101 / 20 / 96x96 / 0 | 3 viewports, fit and 2x zoom, hide HUD | Count 4–6 distinct structure silhouettes (not mere recolors); compare grass/road/water edge and residential/civic/nature identities | NOT RUN manual |
| QA-02 | Q07-camera-follow-death / fixture manifest | pan/zoom/fit/reset, select and follow living NPC, move/kill/reset, resize, manual override/AFK | No jump, no stale follow, correct click target and finite camera coordinates | PARTIAL logic; NOT RUN browser |
| QA-03 | Q07-normal-life / 101 / 20 / 96x96 / 0 | compare overview and district zoom; inspect 24 anchor positions and entrance accessibility | 9216 tiles, 3 districts, >=20 in-map POI, economic entrance connected | PARTIAL source; NOT RUN visual |
| QA-06 | 101 / 20 / 96x96 / hours 06,12,18,23 | same zoom and HUD hidden; capture four frames | Visually distinct dawn/day/dusk/night without reading HUD | NOT RUN manual |
| QA-07 | Q07-rain-shelter and Q07-weather-transition | clear/cloudy/rain/fog captures, rain particles enabled/disabled | Four legible visual states; rain visible without particles through lighting/ground; restored after rain | PARTIAL source; NOT RUN manual |
| QA-12 | Q07-normal-life / 101 / 20 / 96x96 / 0 | 1366x768, 1920x1080, 3440x1440; settings/pause/speed/save/load/mute/reduced-motion | HUD/inspector usable, no critical overlap/console error/duplicate canvas or audio source | NOT RUN manual |

Default actual browser, OS, GPU, FPS, frame p95 and memory: UNKNOWN / NOT MEASURED. No screenshot or video captured in this task environment. UI test `src/game/camera/q07c.cameraQA.test.ts` is an additional pure-logic gate, not screenshot evidence.
