# T06-B — Determinism and state isolation QA

## Automated matrix
New `src/app/t06b.instrumentation.test.ts` uses each map type 48×48 (legacy governance fixture) and native 96×96, populations 20/50/100 and seeds 101/12345 (12 cells), each with diagnostics OFF then ON. Within each replay: real tick scheduling at 20×, queued emergency-food-aid command attempt, pause, hidden/resume, capture canonical WorldState, `stateDigest` and exact exported JSON including RNG, weather RNG when v6, governance requests and ID counter. Both runs must produce exactly equal WorldState, digest and save text. No hard-coded performance threshold.

Independent speed/observer-pacing comparisons: 1×, 5×, 20× and observer pace 5/10/15 min/day on 96×96 20 NPC at seed 101. New tests also cover valid import/reset with telemetry ON, preserving serialized save and live timer lease.

Additional optional real Chromium `tests/e2e/t06b-diagnostics.spec.ts` is authored but NOT RUN. Existing contracts retained: `observerPace.e04a.test.ts` covers clock parity across multiple modes; `save.test.ts`, `v6.test.ts`, weather, legacy frozen fixture and T06-A baseline cover save continuation/compatibility and economic/governance semantics. No save file format, parser, engine pipeline or gameplay RNG was edited.

## Evidence policy
Automated assertions on implementation SHA `0aa4db31` **PASS** in [Fast CI #39392870084](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39392870084): 49/49 Vitest files, 421/421 tests. Final documentation HEAD CI must be verified independently; Chromium/physical Windows state stays NOT RUN. Frame rate and camera tracking depend on presentation only; equality of canonical state is testable without GPU. The 48×48 fixture is **not** a new historical-save golden file; historical save migration remains T06-C.
