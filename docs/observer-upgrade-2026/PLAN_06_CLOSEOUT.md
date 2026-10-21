# Observer Plan 06 — Engineering closeout and Plan 07 handoff

**Date:** 2026-10-21  
**Scope status:** **ENGINEERING IMPLEMENTATION CLOSED (T06-A…T06-F merged)**. Not a product/hardware reliability certification.  
**Source of truth:** GitHub main after PR #46 at `b144272857dd202dcf6106cd29c4c7dc7207444c`.

## Merged gates
| Task | Pull request | Main merge SHA |
|---|---|---|
| T06-A Preflight & baseline | [#41](https://github.com/giabao2605/Tiny-Civilization/pull/41) | `6b44a6f0e81e99438b1a8238153b406cfdf108d3` |
| T06-B Instrumentation & boundaries | [#42](https://github.com/giabao2605/Tiny-Civilization/pull/42) | `d91a1b0b772ac25ba86edb159c017fde3b2ad51b` |
| T06-C Save integrity/migration | [#43](https://github.com/giabao2605/Tiny-Civilization/pull/43) | `00e8706998d3c55d195ad06242ad1eb3c01d7b46` |
| T06-D Renderer culling | [#44](https://github.com/giabao2605/Tiny-Civilization/pull/44) | `a005f5dba6ab6e36b362a2328505db59250b139c` |
| T06-E Local/offline guardrails | [#45](https://github.com/giabao2605/Tiny-Civilization/pull/45) | `2d8c8f2b9d040e917f988d9eb964972f0f30b6db` |
| T06-F Long-run lifecycle | [#46](https://github.com/giabao2605/Tiny-Civilization/pull/46) | `b144272857dd202dcf6106cd29c4c7dc7207444c` |

T06-F final PR HEAD `2ace30a4afc46a66ae5d83c18c2278b9e3bde816`: [Fast CI #39540632573](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39540632573) **PASS** (npm ci, production audit, typecheck, lint, Vitest and build). Exact post-merge main [run #39541678338](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39541678338) **completed/success** on `b144272857dd202dcf6106cd29c4c7dc7207444c`; confirmed independently from PR CI.

## Explicitly unresolved evidence
- Real PC local browser dev/preview, audio, resize, camera and save smoke: **NOT RUN** in this execution.
- FPS median/p95, JavaScript heap, WebGL/GPU resource counts, device specification: **NOT MEASURED**.
- 60–120 min extended soak: **NOT RUN** and not a mandatory merge gate per owner PC-local constraint.
- CI/Vitest does not prove that all GPU/driver resources are reclaimed or that QA-01…QA-12 product acceptance has passed.
- Do not present static asset audits as offline cold-cache/browser proof.

## Preserved invariants
WorldState deterministic, 1 tick = 1 game-hour, pause 0 ticks, 1×/5×/20× don't skip sim ticks, hidden tab no catch-up. Weather/presentation RNG isolated. Stable citizen IDs, economy, governance pending commands and `nextRequestId`. Legacy v5 format 1, historical v6 format 2, current weather v6 format 3, 8 MiB cap, atomic import, genuine v5 golden fixture and 12 frozen SHA-256 checkpoints. No Android, backend, cloud, desktop installer, Chromium E2E gate or deployment.

## Handoff to Plan 07
Start **Q07-A** only: create deterministic fixture and QA-evidence manifest covering QA-01…QA-12, with explicit map/population/seeds/tick horizon, viewport, speed, methodology, expected/actual, test environment and evidence status. Reuse existing T06-A…F tests; avoid duplicate harnesses, unsupported 200-NPC UI assumptions, or altering golden hashes. Q07-C/D/E own manual visual, watchability and hardware metrics; Q07-F owns final release GO/NO-GO and cannot mark a missing measurement PASS. See [Plan 07](plans/07_QA_BALANCING_AND_POLISH.md).

This closeout is a scope transition, not a declaration that all Master Plan AC-01…AC-12 have passed.
