# T06-A — Risk register / blocking evidence

**Audit:** `main@4561660af5c55179df90b73e0d41e5f14b75eede`. Severity = potential effect, not an unverified incident count. **Owner part** names follow-up scope; this PR only records evidence.

| ID | Severity | Evidence and reproduction | Consequence / mitigation | Owner |
|---|---|---|---|---|
| R01 | **HIGH** | `src/app/livingCoordinator.ts:100-115`: second `start()` while timer non-null returns no-op disposer; disposing first cancels shared timer. Repro in fake-timers test: lease A=start, B=start, release A, observe clock halts while B is live. | One coordinator caller can unexpectedly stop another. Add ref-counted idempotent leases, test overlap, hidden/resume, remount; no parallel intervals. | **T06-B** lifecycle instrumentation/correctness, verify soak T06-F |
| R02 | **HIGH** | 96×96 / 100 NPC / seed 3 `E04F_NODE_MATRIX` tick p95 **33.535 ms** (Node CI; 72 ticks); 48/96 comparison is sensitive to routing. | Main-thread jank may occur at 20x; profile browser frame/tick attribution before any optimization. | **T06-B** diagnostic; **T06-D** only evidence-driven change |
| R03 | **HIGH** | Fast CI `ci.yml` lacks Playwright; A05-E 30s/5min human screenshots, 20–30min observer review, physical audio remain NOT RUN. | Green CI cannot establish 60 FPS, recognizable events or audible mix. Maintain manual test matrix, do not claim complete quality. | **T06-E**, **T06-F**, Plan 07 |
| R04 | **MEDIUM** | Save reader accepts formats 1/2/3; plan/README describe older format 1 as if current. Real v5 golden fixture exists only for a specific saved world; 20/50/100 independent legacy goldens not all checked in. | Migration regression or misleading recovery guidance. Freeze and extend fixtures before any schema work; do not alter parser during audit. | **T06-C** |
| R05 | **MEDIUM** | WorldScene `scene.restart` on geometry/seed/tick regression and GameCanvas destroy/recreate; audio is App-owned while ambient layer is Scene-owned. Existing mock tests do not prove 60/120m cleanup. | Possible Phaser handle, listener or sound lifecycle leaks. Instrument created/destroyed, listener refs, heap and actual elapsed on Windows. | **T06-B**, **T06-F** |
| R06 | **MEDIUM** | `createGame.ts` DEV `?observerPerf` has objects, textures, FPS, delta, routing, ambient; not full render workload, CPU or audio voice/particle budget. | Metrics blind spots impede comparative profiling. Add read-only diagnostics with RNG-on/off digest parity and graceful nulls. | **T06-B** |
| R07 | **MEDIUM** | Physical Windows offline `npm run preview` / saved import/export after network disconnect NOT RUN; Playwright release smoke is manual-only. | Runtime might rely on an unobserved CDN or asset/network path. Inspect requests on offline local preview, do not deploy Pages. | **T06-E** |
| R08 | **MEDIUM** | Browser autoplay permission, stereo, bell/rain and audio repeated reset have mocked tests but no real PC listening; A05-E explicitly hands off this gate. | Audio audible errors or missed cleanup remain possible. Test muted/unmuted, hidden/resume, two speakers/headphones, transitions. | **T06-F** and Plan 07 |
| R09 | **LOW** | `README.md` legacy status mentions 48×48, whereas `createLivingCoordinator` launches 96×96 and writer uses `sim-v6-weather`. | Operator confusion when running old save/production smoke. Correct targeted user-facing docs with migration/release owner, not gameplay rewrite. | **T06-C/T06-E** |
| R10 | **MEDIUM** | Playwright full suite has `fullyParallel=true`, hosted runner differences and long stress suites; historical PR logs do not guarantee candidate E2E. | Flaky or slow manual runs. Serial perf workload, save browser version/trace/artifact and rerun specific failures with rationale. | **T06-E/T06-F** |

## Blockers and gates before T06-B

- **No blocker to implementing T06-B instrumentation**: simulation and save Node checks on main are PASS.
- **Acceptance blockers to declaring PC performance complete:** real Chromium screenshots, frame p95/FPS, Windows CPU/memory/audio and 60/120-minute soak **NOT MEASURED / NOT RUN**.
- **Known code defect R01** is a source-level risk; fix only under designated follow-up scope after a failing test proves it. PR #40 contains unmerged candidate changes and is **not** evidence of a fix on main.
- Never change economy/PRNG/save schema for speed. Optimize only after correlated timing/trace proves a bottleneck.

## Evidence links

Main [CI #39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907); A05-E [PR #39](https://github.com/giabao2605/Tiny-Civilization/pull/39); discarded [PR #40](https://github.com/giabao2605/Tiny-Civilization/pull/40); current T06-A [draft PR #41](https://github.com/giabao2605/Tiny-Civilization/pull/41). Source references: `livingCoordinator.ts`, `createGame.ts`, `WorldScene.ts`, `save.ts`, `E04F_NODE_MATRIX` and `W02-F-NODE-METRICS` logs.
