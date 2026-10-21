# Q07-A implementation scope

**Base:** `be7965292023c554baeca2728057378454b0c148` (main closeout #47; T06-F merge `b1442728`). Branch `feat/q07-a-test-plan-fixtures`. This task is QA infrastructure documentation and lightweight manifest checks only; no production simulation, Phaser, save-format or gameplay changes.

Inventory: repository contains 53 Vitest `src/**/*.test.ts` files, 21 historical `tests/e2e/*.spec.ts` files, including retained Playwright release and smoke tests; see matrix for mapping. Vitest covers geometry, routing, engine, needs/economy, social/governance, weather, clock, persistence/checkpoints, ambient/audio render models, and coordinator lifecycle. These are separate from live browser UX and physical soak. Benchmark-named Vitest files aren't proof of real-world frame rate.

The machine-readable manifest provides 11 seeds × 3 populations, 13 reproducible scenarios, save-format references, four weather states, three viewports and immutable golden linkage. Manifest validation checks metadata only. The 30-case existing world96 generator test is reused, not multiplied into a heavyweight thousand-tick matrix. Review overlapping benchmark files before adding runtime tests in Q07-B.

Production ownership stays canonical in WorldState/coordinator; weather/presentation RNG isolated. Do not change the 12 frozen SHA-256 checkpoints, genuine legacy-v5 compressed bytes, atomic import or timestamp semantics. Q07-B owns uncovered fast regression; Q07-C manual visual; Q07-D recorded watchability; Q07-E device benchmarks/soak; Q07-F final decision.
