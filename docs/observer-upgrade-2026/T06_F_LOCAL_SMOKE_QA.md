# T06-F optional manual desktop smoke
Status: NOT RUN. No desktop browser available in this execution; do not claim physical PC reliability, FPS, heap, audio quality or long soak.

On a PC: `npm ci`, `npm run dev`; repeat 5–10 times for each typical 1366×768 and 1920×1080 viewport if available:
1. Create 96×96 worlds with 20, 50, 100 NPC, seeds 101 and 12345.
2. Pause/resume; switch 1×/5×/20×, verify no duplicate hourly ticks.
3. Camera Fit/Reset/Follow/Pan/Zoom; reset canvas repeatedly; check no duplicate canvas and no console errors.
4. Toggle sound during/after allowed gesture; remount while sound is active; verify no doubled audio.
5. Save/pause/reload/import/export; verify restored paused state and unchanged simulation digest; invalid import must not mutate live world.
6. Change tab visibility; ensure no hidden-time catch-up burst; return and resume.

If instrumentation is enabled, compare active timer/lease, Phaser creates-minus-destroys, scene object, texture and voice counts before/after cleanup. GC/driver memory must be measured separately if available. Do not invent memory thresholds.
