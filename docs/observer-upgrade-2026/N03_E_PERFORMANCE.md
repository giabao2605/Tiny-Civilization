# N03-E — Performance and gameplay impact

## Instrumented baseline and method
Historical final N03-C [post-merge CI #39187351220](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39187351220) and N03-D event-only intermediate [CI #39188711226](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39188711226) are the previous hosted-Ubuntu comparisons. N03-D's speculative scenic-POI version is **rejected** and must not serve as baseline.

The inherited `src/sim/n03c.integration.test.ts` computes 720 engine hours per scenario, with seeds `101,107,12345`, counts `20,50,100`, legacy 48×48 and new 96×96 maps, plus paired guarded-weighted versus BFS comparison. Logs `N03C_SIM_BENCH` and `N03C_PAIRED_IMPACT` contain:
- engine tick p50/p95 and runtime, Node/Linux platform, CPU;
- BFS, weighted, fallback and route-request/unreachable counters;
- `routeBlocked`, movement, goal changes, trades, failed actions;
- starvation/deaths, food/wood production, consumption and inventory/cash;
- invariant and replay assertions.

N03-E adds tests for *blocked synthetic paths* but changes neither the matrix nor its golden fixtures. On ordinary connected maps, the new fallback searches are designed to remain dormant; **this is a hypothesis until final-HEAD measurements pass**. On intentionally blocked islands, up to two alternative routes are probed on a failure, then no fallback probe is needed during cooldown.

## Results and cautions
- N03-E final commit metrics: **NOT YET MEASURED** at document creation. Look at the *actual* PR #27 Fast CI log and compare it with previous accepted runs before approving gameplay impact.
- Existing N03-D preliminary 96×96/100 NPC, seed 12345: 0→0 deaths, 2511→2511 food, 1260→1260 trades and p95 9.612→10.299 ms versus earlier N03-C in a **non-final intermediate** comparison. These are context, **not** N03-E results.
- GitHub runner CPU/Garbage Collection/JIT variance can change p95 without gameplay code differences. Do not claim Windows FPS or GPU performance from Ubuntu Node measurements.
- Fast CI duration should be reported using GitHub's completed run timestamps, not a predicted 15–20 minute figure.
- Full Chromium E2E and Windows frame profiling must be run separately, by choice, and are not implied by a Fast CI PASS.

## Rejection triggers for N03-F
Invariant failures, blocked-event storms, increased repeated route requests on an isolated NPC, regression in paired economy gates, 4-step hourly boundary drift or unreproducible seed digests require correction before merge.
