# E04-C Implementation — Weather state and compatibility

**Branch:** `feat/e04-c-weather-state` · **Entry:** E04-B merge `6483ae97f2e409184548285c18ba077be3a9d9b1`; post-merge Fast CI [#39216281181](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39216281181) SUCCESS with matching head SHA.

- `src/sim/weather.ts` is a pure, constant-time weather transition module; no Phaser, clock, timer or `Math.random`.
- `world96.ts` creates authoritative v6 weather; `engine.ts` advances weather on real simulation ticks only, preserving historical v5 state and gameplay decision order.
- `save.ts` validates format 3 weather strictly, migrates original format 1 to v6 with weather and hydrates original format 2 with weather at the saved current tick. Immutable legacy v5 paths and full-world projection remain available.
- v6 frame snapshots carry weather only as data. Lighting, windows, roads, NPC actions and economic PRNG are unchanged. Visual rain/fog/puddles remain E04-D.
- New tests: seeded transitions/dwell, 10k pure-weather ticks, 48×48 economic paired continuation, 96×96 20/50/100 long replay, format 1/2/3 compatibility, malformed import, exact transition boundary. Frozen fixture files not modified.

**Verification:** Fast CI requires exact final PR head SHA and actual GitHub checks. Local `npm ci`, audit, lint, typecheck, Vitest and build are NOT RUN in this isolated environment (outbound npm/GitHub DNS unavailable). Optional Chromium E2E and physical GPU/CPU/FPS NOT MEASURED. Tests/CI are not claimed PASS before checks complete.
