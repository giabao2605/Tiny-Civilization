# T06-D — Determinism and save regression QA

T06-D changes only presentation code and pure camera geometry. Authoritative `src/sim`, save code, weather/gameplay RNG, stable NPC IDs, movement and governance commands remain untouched. Genuine historical v5 48×48 fixture and 12 frozen T06-C SHA-256 checkpoints were not rewritten.

At [Fast CI #39531644349](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39531644349), code HEAD `7b16e8b3`: npm ci, production dependency audit, typecheck, lint, 51/51 Vitest files, **444/444 tests**, build all SUCCESS. These include existing golden fixtures, v5/v6 save compatibility, atomic import and determinism/diagnostics regressions. Latest HEAD after scope reduction adds fast pure culling geometry unit tests and removes dedicated Chromium tests; rerun Fast CI and report exact final SHA separately.

Physical Windows browser visual checks, audible audio and 60–120 minute soak are NOT MEASURED / NOT RUN, not new mandatory gates. Existing optional E2E remains separate from Fast CI.
