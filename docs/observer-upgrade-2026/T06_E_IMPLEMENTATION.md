# T06-E Implementation — PC localhost first

Baseline: main a005f5dba6ab6e36b362a2328505db59250b139c, T06-D PR #44 merged, post-merge Fast CI #39536526844 completed/success. Branch feat/t06-e-local-offline.

Scope: documentation and lightweight Node/Vitest offline entrypoint guard. Existing React + Vite + Phaser application already supplies dev/preview scripts and local data persistence; no simulation, renderer, routing, RNG, weather, golden fixture, save format, backend, service worker or deployment change is justified by source audit.

Changes: README PC clone/install/run/build/preview/offline/backup/troubleshooting instructions; localRuntime.test.ts asserts local favicon/base path, no remote script/style in HTML, no remote CSS import and no required network APIs in principal runtime entrypoints. Any optional external GitHub bug-report hyperlink is permitted. This static test is not equivalent to inspecting real browser requests. No Chromium/Playwright E2E performed.
