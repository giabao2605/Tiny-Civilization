# T06-D renderer lifecycle QA

Source audit: WorldScene creates listeners for input, visibility and prefers-reduced-motion, then removes them on SHUTDOWN; weather and ambient adapter/director are disposed; generated lighting textures are removed. This is **code observation**, NOT leak certification.

**NOT RUN**: repeated scene restart/remount, camera fit/follow/zoom/pan, 48x48/96x96 load, weather transitions, effects off/on, frame screenshots, hidden-tab, long-run cleanup, actual count of active timers/listeners and canvas recreation.

Capture baseline and candidate object/texture counts, heap and screenshot parity after each repeated cycle before asserting fixed leaks.
