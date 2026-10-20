# T06-A → T06-B handoff (2026-10-20)

## Verified base, artifacts and constraints

Repository: https://github.com/giabao2605/Tiny-Civilization; branch `feat/t06-a-preflight-baseline`; [draft PR #41](https://github.com/giabao2605/Tiny-Civilization/pull/41), **do not merge**. Base main `4561660af5c55179df90b73e0d41e5f14b75eede`; [CI #39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907) SUCCESS, 47/47 files, 394/394 tests on base. After audit candidate commits, inspect **PR #41 checks on exact last head SHA** before acceptance. The PR body records final SHA/run; documents cannot embed their own SHA reliably.

- [Implementation](T06_A_IMPLEMENTATION.md) / [Architecture](T06_A_ARCHITECTURE_AUDIT.md) / [QA](T06_A_BASELINE_QA.md) / [Performance](T06_A_PERFORMANCE_BASELINE.md) / [Risks](T06_A_RISKS_AND_BLOCKERS.md).
- Invariants protected: canonical 1 tick = 1 hour, fixed deterministic engine, WorldState v5/v6, current save writer **format 3** / `sim-v6-weather`, legacy v5 reader format 1 and old v6 format 2, 8 MiB maximum, governance queue, atomic import. No schema/PRNG/engine changes in T06-A.
- Identified source-level **R01** multiple-caller `start()` disposer ownership and **R02** 96×96 /100 NPC main-thread tick p95 pressure; no optimizations presumed.
- Already available `?observerPerf=1` DEV diagnostics, Node W02-F/E04-F suites, optional real-browser Playwright performance specs and Windows `scripts/observer-benchmark.ps1`. T06-A introduced `T06A_NODE_BASELINE` max tick and save logging.
- Outstanding: browser E2E **NOT RUN**; PC FPS/CPU/heap/audio/camera/soak **NOT MEASURED**. A05-E screen legibility and real audio acceptance still OPEN.

## Ready-to-copy task execution prompt: T06-B

> # TASK: Tiny Civilization — T06-B: Architecture Boundaries & Instrumentation
>
> Act as Lead Software Engineer + Simulation Architect + Performance/QA Engineer. Repository: https://github.com/giabao2605/Tiny-Civilization. **First verify live main HEAD, T06-A PR #41 state, its final exact SHA and corresponding GitHub Actions conclusion. Do NOT assume it is merged.** Only start T06-B from the owner's explicitly reviewed/merged T06-A baseline, or report the dependency blocker without building atop an unmerged unrelated branch.
>
> Read README, docs/PROGRESS.md, docs/SIMULATION_CONTRACT.md, docs/observer-upgrade-2026/MASTER_PLAN.md, plans/06_TECHNICAL_LOCAL_AND_PERFORMANCE.md, all T06_A_*.md, A05_E_HANDOFF.md, and current source/tests. Verify the documented owner map against HEAD rather than copying stale conclusions.
>
> Scope **ONLY T06-B**: add opt-in, read-only diagnostics for simulation tick p50/p95/max and per-tick routing/BFS/weighted request counts; add/complete Phaser frame duration/FPS, scene object/texture/particle and ambient actor creation/destruction counters, and audio voice/loop/bus diagnostics with safe null when unavailable. Do not create parallel performance timers, change RNG draw order or accumulate unbounded metric history. Show useful debug data with an OFF switch and avoid treating dev overlay as gameplay. Sample UI snapshot batching, create/destroy/reset/remount and hidden/visible life cycle; measure observer pace vs 1x/5x/20x without skipping canonical ticks.
>
> Explicit R01 regression: write a failing multi-caller `livingCoordinator.start()` lease test (A=start, B=start, dispose A, B still advances; dispose B stops; repeated dispose is idempotent, only one timer/listener). If reproduced, apply minimal reference-counted lease fix, retest overlapping mounts and fake visibility changes. Do not copy PR #40 blindly; it is CLOSED and never merged. Validate scene/audio listener and resource cleanup using counters and targeted tests only within T06-B scope.
>
> Determinism gate: run 48×48 legacy v5 import and 96×96 native worlds, populations 20/50/100, same seeds and exact commands for diagnostics OFF vs ON; compare full canonical state or digest, economic/weather RNG and pending governance after N ticks and save roundtrips. Test paused/hidden resume, reset seed, scene remount, camera follow/fit/zoom and no duplicate Phaser/clock timers; never introduce camera/FPS/visibility dependence in `advanceOneTick`.
>
> Run npm ci, typecheck, lint, Vitest, build; run Playwright Chromium only when actually available, and annotate NOT RUN otherwise. Record exact Node/npm/OS/Chromium/CPU/GPU, screenshot and raw metric artifact paths. Use T06-A numbers **only as fixed reference**, measure candidate separately, no fabricated FPS/heap/CPU. Do not add backend/worker/Electron, optimize routing/terrain or change save schema: those belong to T06-C/D/E/F.
>
> Git workflow: new `feat/t06-b-instrumentation` from verified current main, commit/push, PR to main in DRAFT, **do not merge or deploy**. Write T06_B_IMPLEMENTATION.md, T06_B_INSTRUMENTATION.md, T06_B_DETERMINISM_QA.md, T06_B_LIFECYCLE_QA.md, T06_B_PERFORMANCE.md, T06_B_HANDOFF.md; update PROGRESS.md. Verify Github CI result for **final exact PR HEAD**; present log URLs, test counts, PASS/PARTIAL/NOT RUN, open risks and T06-C next-task prompt.
>
> Acceptance: metrics objectively sourced and bounded, no state divergence, lifecycle lease regression solved if confirmed, all Fast CI checks PASS on final head; browser/hardware gates honest.

## T06-A acceptance verdict

Audit, architecture, seed/save test coverage and base CI are **verified on main**. New candidate test and final CI must be verified by PR before declaring T06-A **CODE VERIFIED**; PC/browser performance remains **PARTIAL** despite real Node metrics. Owner reviews draft PR; **no merge** here.
