# T06-B → T06-C handoff

## Verified foundation and proposed branch
Base `main@6b44a6f0e81e99438b1a8238153b406cfdf108d3`, Fast CI #39390044744 SUCCESS. Proposed Draft [PR #42](https://github.com/giabao2605/Tiny-Civilization/pull/42), branch `feat/t06-b-instrumentation`; not merged. Get **final HEAD and CI run URL from live GitHub**, not a SHA embedded in this document.

## Scope done in code
Bounded opt-in simulation/Phaser timing, routing deltas, notification gaps, scene/weather/ambient/audio monitoring and diagnostic toggle; coordinator clock shared-lease R01 fix and tests. No gameplay, engine RNG, schema, parser, pathfinding optimization, packaging or Pages changes. Browser performance and Windows audio/soak gates remain open; defer T06-D/E/F decisions until measured.

## Next task prompt — T06-C
> # TASK: Tiny Civilization — Plan 06 / T06-C: Save Compatibility and Schema Contract
>
> Act as Lead Software Engineer + Simulation Engineer + Persistence/QA Engineer. Repository: https://github.com/giabao2605/Tiny-Civilization. **Start by verifying current live `main`, T06-B PR #42 status, final exact SHA and Actions results. Do not build on an unmerged draft without owner approval.**
>
> Read `README.md`, `docs/PROGRESS.md`, `docs/SIMULATION_CONTRACT.md`, Observer Master Plan and Plan 06, `T06_A_*.md`, `T06_B_*.md`, `src/persistence/save.ts`, `src/sim/world*.ts`, engine, governance commands, historical golden fixtures/tests.
>
> **Only T06-C.** Audit and freeze the actually implemented compatibility matrix before editing: legacy v5 48×48 saveFormat 1, historical v6 format 2, current v6+weather format 3/`sim-v6-weather`, 8 MiB cap and pending governance command/request IDs. Plan 06 prose may be stale: do not blindly rewrite an already-shipped v6 writer. If no schema change is technically necessary, improve validator/golden fixtures/docs without changing the on-disk envelope. If a genuine migration is needed, document ADR and version policy first, preserve legacy import and exact economic/social/weather/PRNG data and atomic failure behavior.
>
> Build 20/50/100 NPC golden compatibility/continuation fixtures when sources permit, compare stable IDs, tick, money, food, wood, families, market, governance, RNG, weather, queued policy/request IDs, and save→load→continue. Explicitly test corrupted/unknown/oversized/quota/partial JSON and no live-state mutation on failures. Do not alter rendering, FPS sampling, clock rates or gameplay policy. Run npm ci, production audit, typecheck, lint, full Vitest, build and Chromium E2E when accessible; distinguish unrun browser tests. Do not invent Windows performance or audio results.
>
> Create a new branch from verified merged base, commit/push, **Draft PR to main, do not merge or deploy**. Document compatibility matrix, ADR if needed, golden test hashes/replay, exact final SHA/CI URL, risks and T06-D handoff. Never weaken T06-B diagnostics ON/OFF world-state equivalence. Do not duplicate existing save format work merely because a plan says "migration".
>
> Acceptance: backward-compatible atomic read/writer, deterministic continuation, fully green exact-head Fast CI; unmeasured browser/PC gates labeled NOT RUN/NOT MEASURED.

## Open issues
R02 96×96/100 NPC tick latency; real Chromium FPS, Windows load/save, GPU/heap, audio audibility and long soak not checked in this environment. T06-D needs controlled profiling, T06-E offline smoke, T06-F resource reliability.
