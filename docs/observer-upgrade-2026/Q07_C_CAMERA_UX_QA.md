# Q07-C camera and PC UX audit

## Pure logic assertions
Run `npm run test -- src/game/camera/q07c.cameraQA.test.ts` with Vitest (also included in `npm run test`). Test map 96x96 at tile size 12 = 1152 world pixels, and 48x48 = 576. Viewports 1366x768, 1920x1080, 3440x1440. For each, assert finite fit zoom, no viewport overflow, legal center bounds and pointer anchor identity at three screen points. Assert AFK idle timer respects recent activity and reduced motion. Test has no DOM/canvas assertion.

## Manual browser steps (NOT RUN)
1. `npm ci && npm run dev`; use PC localhost. Record browser/OS/GPU/version and seed 101, population 20, 96x96, starting tick 0.
2. At each viewport, Fit, Reset, wheel zoom at each corner, drag to edges, resize after selecting a citizen; capture camera position and pointer target before/after.
3. Fixture `Q07-camera-follow-death`: select a living NPC, enable follow, advance ticks, manually pan, follow again, kill target via test fixture only, load/reset/create world; ensure follow cancels, no exception or stale sprite; remount scene once.
4. Turn AFK on, let 60s inactivity elapse, manually pan/zoom; confirm manual interaction stops director. Test reduced-motion mode and document hidden/visible.
5. Pause/speed/mute/autoplay lock, save/load, inspector readability and map coverage on 1366x768/1920x1080/3440x1440; record console warnings/errors.
6. Legacy 48x48 loaded save: Fit and click targets after resize; do not assert same layout as fresh 96x96.

Evidence record for each step: QA ID, fixture, seed/pop, map, starting/observed tick, speed, observer pace, viewport, environment, expected/actual, artifact path, command, SHA, CI and PASS/FAIL/PARTIAL/NOT RUN. Do not mark manual checks PASS from source inspection.
