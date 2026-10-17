# N03-A — Regression QA, Reproduction Inventory and Measurement

**Entry:** PR #21 and #22 merged at `main@cf721343`, [post-merge CI #39009292713](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39009292713) PASS. All findings below distinguish **source audit**, **regression code**, and **measured CI evidence**.

## Existing regression protected (not new features)

- Frozen v5 SHA-256 seed 613 / 50 NPC / tick720→816: `src/persistence/legacy-v5.fixture.test.ts`, `src/persistence/v6.test.ts`.
- v5→v6 48×48 migration and v6 96×96 roundtrip; malformed import atomicity: `src/persistence/v6.test.ts`, `save.test.ts`.
- 48×48 and 96×96 exact N/E/S/W BFS reference parity: `src/sim/pathfinding.w02f.test.ts`.
- Existing 48×48 unreachable field, changed water-route recovery, no teleport: `src/sim/engine.test.ts`.
- Commerce, social, governance, survival: `economy.test.ts`, `social.test.ts`, `governance.test.ts`, `survival.test.ts`.
- 96×96 construction/roads, seed, reachability: `world96*.test.ts`, `observerW02E.benchmark.test.ts`.
- Browser/real Phaser viewport/Fit/Follow/NPC selection and persistence: `tests/e2e/*`. Playwright is run on actual Vite/Phaser application; no SVG/mock substitute.

## N03-A additions

- `src/sim/n03a.behavior.test.ts`: 4×48 hourly worlds, fixed seed and commands, event/order and selected NPC causal trace, 24+24 split save replay, RNG, ownership, dead actors, water, cardinal no-teleport motion, hourly budget, same-seed repeated equality, baseline distribution logs.
- `src/sim/n03a.blocked.test.ts`: synthetic 96×96 unreachable resource-node and changed cached-route water obstacle, bounded cooldown/fallback and no unsafe movement. These are **synthetic tests**, not evidence of a spontaneous production deadlock.
- `tests/fixtures/n03a-behavior-goldens.json`: source-captured immutable trace and five checkpoints for each matrix row.

## Stuck / RouteBlocked inventory

| ID | Hypothesis / reproduction | Expected behavior | Status / severity |
|---|---|---|---|
| RB-01 | Fixed-seed v5/96 world; change all farmer field nodes to water, advance to scheduled work 06:00 | Emit `routeBlocked`, use home/commons fallback, throttle repeated attempts for 12 hours | Synthetic scenario covered; **not** a spontaneous stuck claim |
| RB-02 | Advance until a citizen has a cached route, change a future route tile to water, advance 1 tick | Detect invalid route, emit `routeBlocked`, rebuild fallback; never enter water | Synthetic scenario covered |
| RB-03 | Unchanged destination but empty route away from destination | Engine only calculates path on destination change or route water invalidation; possible unbounded stillness if malformed old state | **Code watchpoint, not reproduced.** Requires valid-world seed/tick/ID reproduction before marking bug |
| RB-04 | Same citizen oscillates work/home/sell on repeated ticks | Can be valid supply/energy schedule; count goal transitions, compare reason, capacity and cooldown | Monitored by traces; no claim of defect without replay |
| RB-05 | NPC offscreen or 20× sprite snaps to authoritative position | UI batches frames; world steps remain deterministic | Presentation-only; test movement in engine, browser suite separately |
| RB-06 | Home/market unreachable, stale production node, route cost on grass | BFS permits grass/forest, only water blocks. Test with explicit coordinate/seed if reported | No unverified assertion of real stuck |

For any later confirmed defect report **seed, schema/dimensions, exact tick, NPC ID, goal/destination/route, expected/actual, event ID, reproduction actions, gameplay effect and severity**. Do not fix weighted routing in N03-A.

## Method and limits

- Node tests measure tick p50/p95 and path-calls p50/p95 over 48 engine ticks per matrix row. A separate maximum 32 `findPath` calls per case provide isolated approximate path p50/p95; those durations **are not exact in-engine path time**. Route length quantiles measure pending-route lengths after each tick; movement density is moving-citizen-hours / (48×initial population).
- Runner: GitHub-hosted Ubuntu, Node major 22, same seed 12345 for 96×96. Host CPU not pinned; don't claim improvement versus a different runner or GPU measurement. Logs under `N03A_BASELINE`. Existing W02-F 48-tick reference remains `src/sim/w02f.benchmark.test.ts`.
- Commands: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`. The existing CI additionally runs production-audit, Pages-mode build and real production Playwright smoke. Local physical **Windows** hardware test, 60–120-minute soak and FPS stability remain **NOT RUN / PARTIAL**.
- N03-A does not use browser output to claim algorithmic determinism; deterministic regressions execute independently of React/Phaser. Existing real Playwright suites still must pass before acceptance.

## Captured actual CI baseline (first immutable fixture run)

**Evidence:** [PR #23 first CI #39011617399](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39011617399) **PASS** (including Vitest, typecheck, lint, build, real Chromium E2E, production smoke). Snapshot/metrics from the **initial N03-A test capture** on hosted Linux/Node 22; logged under `N03A_FIXTURE` and `N03A_BASELINE`. Golden manifest was frozen separately from the captured run and must be revalidated on **final PR HEAD**. No physical Windows hardware runs were performed.

| 48-hour scenario | Tick p50/p95 ms | BFS calls p50/p95 per tick | Isolated path p50/p95 ms | Pending route len p50/p95 | Moving citizen-hours | RouteBlocked | Failed action delta |
|---|---|---|---|---|---:|---:|---:|
| v5 48×48, 50 NPC seed613 from tick720 | 0.843 / 3.327 | 13 / 51 | 0.004 / 0.037 | 5 / 15 | 974 / 2400 | 0 | 0 |
| v6 96×96, 20 NPC seed12345 | 0.657 / 3.236 | 8 / 21 | 0.089 / 0.164 | 31 / 72 | 785 / 960 | 0 | 0 |
| v6 96×96, 50 NPC seed12345 | 1.660 / 8.694 | 21 / 51 | 0.165 / 0.299 | 32 / 76 | 1951 / 2400 | 0 | 0 |
| v6 96×96, 100 NPC seed12345 | 2.220 / 17.444 | 33 / 101 | 0.074 / 0.168 | 31 / 72 | 3924 / 4800 | 0 | 0 |

Initial/final currency remained **2440/2440**, **6100/6100**, **12200/12200** for 96×96 20/50/100 respectively; legacy 48×48 50 NPC stayed **6100/6100**. 48-tick RNG final state and state digests are frozen in the manifest, respectively v6: `4057570402/b6c2026b`, `1666300884/ba53f1e5`, `141899122/4491d396`; legacy: `3189418097/c4f65607`. The zero RouteBlocked counts describe **these unmodified seeds and short horizons only**, not global absence of stuck NPC. Synthetic blocked tests are separate. Node runner jitter changes timings; **do not compare these with earlier W02-F CI runs as proof of speed regression/improvement**.

### Acceptance interpretation

- First capture: typecheck **PASS**; lint **PASS**; Vitest **PASS**; build **PASS**; E2E **PASS**; production smoke **PASS** (CI #39011617399).
- Second/final commit with immutable expected manifest: **PENDING final PR CI verification** at time of documenting; no claims about final suite until it completes.
- Physical Windows hardware, 60–120 min soak, GPU/FPS and manual target-PC validation: **NOT RUN / PARTIAL**.

