# T06-C → T06-D handoff

## Status
**Branch:** `feat/t06-c-save-compatibility`; [Draft PR #43](https://github.com/giabao2605/Tiny-Civilization/pull/43). **DO NOT MERGE.** Baseline `main@d91a1b0b772ac25ba86edb159c017fde3b2ad51b`, post-T06-B merge [CI #39394639636](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39394639636) SUCCESS. Exact final implementation HEAD and Fast CI status: **PENDING**, verify on GitHub before claiming CODE VERIFIED.

## Delivered / still open
Reader format 1/2/3 preserved; minimal pending citizen reference guard; new legacy-migration, format-2, UTF-8, paused/running atomicity, and 48/96 × population/seed checkpoints. Existing v5 genuine golden bytes and expected hashes untouched. Twelve separately pinned engine-generated 48/96 × 20/50/100 × two seeds (tick 24) hashes are stored in `tests/fixtures/t06c-engine-checkpoints.expected.json` with source and CI provenance. Independent archived v5 20/100 and authentic format-2 user files remain absent; source-generated checkpoints are not equivalent to historical user backups. Physical browser and Windows Playwright/localStorage quota/performance remain **NOT RUN / NOT MEASURED**, not hidden as PASS. See `T06_C_*_QA.md`.

## Ready-to-copy T06-D task prompt

> # TASK: Tiny Civilization — T06-D: Evidence-Driven Renderer & Map Performance Optimization
>
> Act as Lead Game/Performance Engineer + Phaser/React Architect + QA Engineer. Repo: https://github.com/giabao2605/Tiny-Civilization. First verify exact live `main`, T06-C PR #43 review/merge state, its **final** implementation SHA and successful exact-head Fast CI. Start from verified current main only after owner merges T06-C; never build on an unmerged PR without explicit approval.
>
> Read README, docs/PROGRESS.md, docs/SIMULATION_CONTRACT.md, observer MASTER_PLAN, Plan 06, T06-A/B/C audits and handoffs, T06_B_PERFORMANCE.md, `src/game/createGame.ts`, `src/game/scenes/WorldScene.ts`, `src/app/livingCoordinator.ts`, `src/app/observerMetrics.ts`, `src/sim/routing.ts`, `src/sim/pathfinding.ts`, `src/sim/weightedPathfinding.ts`, `src/persistence/save.ts` and relevant tests.
>
> **T06-D only**: establish real before/after baselines with identical seed, population, hardware, viewport, browser, clock/diagnostics flags, and fixture. Profile terrain draw, static map layers, decorative object count and culling, particles, animation and routing cost with existing bounded telemetry. Examine 48/96 map, 20/50/100 NPC, seed 101/12345/3, 1366×768 and 1920×1080; benchmark stress seed 3/100 NPC separately. Record median FPS, p95 frame/tick, heap and rendering object counts, time windows, machine/browser versions; report NOT MEASURED where unavailable.
>
> Change only proven bottlenecks with small local fixes, e.g. terrain static cache/chunks, decorative view culling, pooled particle effects or routing memoization only if call-level traces prove benefit. Offscreen NPCs must still advance canonical ticks. Never alter gameplay/economy/social/governance/weather RNG, seed, `WorldState`, route correctness, save formats, renderer ownership or T06-B coordinator lease behavior. No Web Worker, backend, Electron/Tauri or GitHub Pages.
>
> Gate deterministic digest/full-world parity before/after changes across 48/96 × 20/50/100, commands and saved worlds; protect legacy v5 frozen hashes, format 2/3 reads, 8 MiB and invalid atomic imports; test diagnostics ON/OFF and hidden/pause/resume and Phaser scene remount. Run npm ci, production audit, typecheck, lint, Vitest, build, Chromium E2E if available. Do not claim 60 FPS or Windows acceptance from Node/Vitest mocks.
>
> Work in a new `feat/t06-d-render-map-performance` branch from verified merged main, produce implementation/profiling/regression/QA/handoff docs and update PROGRESS. Commit/push and open a **Draft PR**; inspect Fast CI on exact final SHA. Do not merge/deploy. If profiling evidence cannot be collected, report baseline limitation and prioritize safe observable instrumentation rather than speculative optimization.

## Remaining dependency
Owner review and merge of T06-C comes first. Next, measure T06-D optimizations under actual Chromium/Windows; T06-E handles PC offline runtime and packaging smoke, T06-F covers soak/resource reliability.
