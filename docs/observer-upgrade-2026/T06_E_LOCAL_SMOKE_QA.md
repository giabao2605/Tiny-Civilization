# T06-E Desktop local smoke checklist

**NOT RUN**: no suitable physical PC browser/localhost checkout within this execution environment. No Chromium download/Playwright benchmark attempted. To complete local smoke, use Node 22 + npm 10 on desktop and run npm ci, npm run dev and npm run build && npm run preview, open Vite-printed addresses.

- At dev and preview verify nonblank 96x96 terrain, NPCs, React controls, procedural trees, ambient/weather and absence of unhandled Console exceptions.
- Create seed 101 with 20, 50, then 100 NPC; regenerate with seed 12345. Pause/resume and set 1x/5x/20x; make sure pause/save does not tick.
- Select NPC, camera Fit/Reset/Follow/Zoom/Pan, and remount canvas; verify forest returns on camera re-entry.
- On 1366x768 and 1920x1080 check inspector, controls, map pan and canvas sizing.
- At a single origin save, reload, load and compare seed/tick/citizen count; export JSON, import it on preview origin, reject invalid and >8 MiB JSON while current world is unchanged.
- Disable external Internet while allowing loopback localhost; reload dev/preview and check Network tab for external requests, save/load.

No FPS, heap, GPU or lengthy soak result is asserted. Keep any manual smoke finding separate from exact-HEAD Fast CI.
