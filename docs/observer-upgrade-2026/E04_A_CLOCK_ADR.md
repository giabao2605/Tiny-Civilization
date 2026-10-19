# ADR E04-A — Observer Pace as an opt-in runtime clock rate

**Date:** 2026-10-19  
**Status:** PROTOTYPE ONLY. Default selection DEFERRED pending physical-PC 30-second / 5-minute observation and owner approval.  
**Baseline:** `main` at `aa9de47cdd7cfab1e87b8c3217e41c64e2ac12dc`, merged PR #28; Fast CI post-merge #39209568831 SUCCESS.  
**Scope:** E04-A only. No lighting, weather, NPC scheduling, ambient or audio changes.

## Contract and audited implementation

- `src/sim/engine.ts`: one `advanceOneTick` call advances exactly one authoritative game-hour. `dayOf(tick) = floor(tick/24)+1`, `hourOf(tick) = tick % 24`. It remains the sole gameplay clock, with fixed action/transaction/PRNG order.
- `src/sim/clock.ts`: 1×/5×/20× target **2/10/40 ticks per real second**. `onElapsed` consumes scheduler elapsed slices, caps eight callbacks, discards nonfinite/nonpositive/>250-ms slices and all hidden/paused elapsed, and resets its fractional accumulator on mode/pause changes. Runtime speed/observer choices are never serialized.
- `src/app/livingCoordinator.ts`: 25-ms interval, `performance.now` deltas, visibility listener resets elapsed; one authoritative world, no background catch-up. At legacy 5×/20× UI paints are batched every 2/4 game-hours; `renderPaths` carries actual hourly intermediate moves (N03-F). Observer mode publishes every game-hour.
- `src/game/scenes/WorldScene.ts`: Phaser tween follows real `lastMove`/`renderPaths`, max 450 ms per paint under legacy rules, while camera/scene renders independently. `GameCanvas` is a view of the coordinator snapshot; `src/persistence/save.ts` serializes WorldState/governance queue only.
- Docs discrepancy: historical README sections still describe the early Phase 07 state, while N03-F merged and the newer observer upgrade is current; E04-A follows live `main` and the Observer Plan 04 contract rather than rewriting historical scope.

## The experiment, not a gameplay rebalance

| Runtime choice | Engine ticks/real second | Real seconds/game-hour | Real time/24-tick game-day | Expected new hours in 30s / 5min |
| --- | ---: | ---: | ---: | ---: |
| Legacy 1× | 2 | 0.5 | 12 s | 60 / 600 |
| Legacy 5× | 10 | 0.1 | 2.4 s | 300 / 3,000 |
| Legacy 20× | 40 | 0.025 | 0.6 s | 1,200 / 12,000 |
| Observer 5 min/day | 0.08 | 12.5 | 300 s | 2.4 / 24 |
| Observer 10 min/day | 0.04 | 25 | 600 s | 1.2 / 12 |
| Observer 15 min/day | 0.026667 | 37.5 | 900 s | 0.8 / 8 |

Counts for windows are ideal rates (not promised exact integer boundaries); actual ticks are discrete and workload/suspension may reduce counts.

**Separation of concerns:** This changes only when the existing deterministic `advanceOneTick` executes in real life. No interpolated sun clock, alternate NPC day schedule, wall-time hunger/work/trade or economic PRNG draws. If a selected 15-minute day produces 0 ticks in the first 30 seconds, the game has made no authoritative progress. Cosmetic animation could run between ticks in a future plan; it cannot advance the game state.

## Decision

1. Implement all three observer choices as an explicit **off-by-default** runtime prototype through a compact selector. Switching to any legacy speed exits observer mode, and disabling observer returns to the previously selected legacy speed. Existing 1×/5×/20× labels and numeric rates remain untouched.
2. Accumulator reset on mode change deliberately drops **fractional progress** of one unfinished hour; it does not remove or duplicate any completed tick. This protects against a 20× backlog being emitted instantly in observer mode. Hiding/pausing similarly discards elapsed time.
3. **Do not select a new default.** The 5-minute option is the least sparse candidate (about 2–3 new game-hours in 30 seconds), while 10/15 minutes risk 1/0 new hours. Plan 05 ambient and Plan 04 day/night layers are not built. Current Phaser NPC tweens end in at most 450 ms per hourly snapshot: at 5/10/15 minutes the picture may appear idle for ~12/25/37 seconds between ticks. A long duration tween is not added blindly because accelerating back to 20× while a 30-second tween runs could cause an apparent snap; that needs separate visual measurement/design.
4. CPU: expected simulation calls per real minute are 4.8/2.4/1.6 in observer modes instead of 120/600/2400 at legacy 1×/5×/20×. This is analytical, **not measured CPU/GPU/FPS**. Phaser/React still render independently; no claim of reduced frame cost or improved visual quality.
5. Existing `renderPaths` path ownership stays unchanged, and observer publishes at each true tick. Every selected pace is reversible without changing save format. UI state is intentionally lost on application restart and defaults back to 1×.

## Evidence and verification boundary

Required automated matrix: 24-tick/day, six-mode state/digest equivalence with the same ordered emergency-food policy command, paused/hidden and no catch-up, switch transitions and actual contiguous traced moves, v6 save/replay, all frozen N03-A/N03-C/economy/survival/social/governance suites. Pre-final implementation run [#39211980594](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39211980594) PASS on `519f29ee`: 36 test files / 290 tests, audit production 0, typecheck/lint/build. The subsequent documentation+command-test commit requires its **own exact-head Fast CI**; look at PR #29 for the final-head run.

**Not yet demonstrated:** local-PC 30s and 5min real observation at every option; actual FPS/CPU/heap; animation smoothness when switching during a tween; screenshots; ambient diversity; physical input behavior. Chromium E2E is manual-only and not required. Do not mark visual/watchability PASS without human evidence.

**Owner decision gate:** capture same seed/population/viewport, record visible distinct movement/events at 30 seconds and five minutes and subjective readability at 1× versus 5/10/15-minute modes. Only then consider default change as a separate accepted task.

## Rollback

Set selector to **Tắt**, or select any 1×/5×/20× button. Revert E04-A clock/coordinator/UI changes for full source rollback; unchanged `WorldState`, PRNG, engine, N03-F render trace and save format make existing save files compatible. No E04-B–F work is included.
