# W02-A — Frozen legacy save v5 QA and provenance

**Snapshot source:** unmodified v5 engine at `main@4149442f026be2f404c249511fdbc9ad2b7f5867` (after V01-E / PR #15). The generator in `src/persistence/legacy-v5.fixture.test.ts` called the **actual** `createWorld(613,50)`, `advanceTicks(...,720)`, `serializeSave`, `parseSave`, `advanceOneTick` and `advanceTicks` in GitHub Actions [bootstrap CI 38861809236](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861809236). This source-side test used the real engine and did not hand-author a WorldState or mutate NPC finances. The bootstrap CI run is not the final fixture gate: the output was subsequently frozen and a **non-skippable** fixture verification test committed.

## Frozen files

- `tests/fixtures/legacy-v5-48x48.json.gz.b64`: gzip-compressed **exact JSON envelope** encoded base64, captured from CI logs `W02A_BOOTSTRAP_CHUNK_000..014`. Storage compression only; test decodes and calls real v5 `parseSave`. To inspect locally: `base64 -d tests/fixtures/legacy-v5-48x48.json.gz.b64 | gzip -d` on a compatible shell (Linux/macOS); on Windows use Node `Buffer.from(...,'base64')` and `gunzipSync`.
- `tests/fixtures/legacy-v5-48x48.expected.json`: frozen manifest from the same CI run, including the original exact SHA-256 digests and version/counters.
- `src/persistence/legacy-v5.fixture.test.ts`: verifies bytes, manifest, v5 parser, world identity, inventory and money conservation, whole-world SHA-256, queued governance command, deterministic continuation and malformed tile/position rejection; also independently regenerates the fixture from the current legacy engine to detect semantic drift **before W02-B**.

## Manifest (frozen source facts, not predictions)

| Field | Value |
| --- | --- |
| `saveFormat` / `engineVersion` / `schemaVersion` | 1 / `sim-v5-phase06` / 5 |
| Seed / population | 613 / 50 |
| Legacy world | 48×48, 2,304 tiles |
| Checkpoint / continuation | tick 720 / 96 additional hours (end tick 816) |
| Raw JSON save UTF-8 length | **263,532 bytes** |
| `rngState` | 3718096612 |
| `nextEntityId` / `nextEventId` | 137 / 7256 |
| Citizen count / households | 50 / 30 |
| Directed social relation edges | 913 |
| Retained market trade records | 30 |
| Governance elections | 1 |
| Queued commands / nextRequestId | 1 / 2 |

Cryptographic golden values:

```text
saveSha256                 d092ab398c3522493d67a5b2f3b83520d42f577fc7ef9f3bb240d45f3a4d40c9
worldSha256                4450cd0df0bb29e708c2ecf89f4beeff6130acc8cb2c50e4512ccf3640ad0ea1
continuationWorldSha256    0b97eb5f20f2af3004c5f153441e5acee331e727aa9b4e3d5c20277f786ad12d
```

A `worldSha256` value is SHA-256 over **`JSON.stringify(world)`**, including terrain and field order. It is not `stateDigest`: `stateDigest` currently skips `world.tiles`. Golden `saveSha256` covers the entire exported envelope, including `pending` and `nextRequestId`. The source produces a *nonempty* social graph and real governance election after 720 ticks, so this fixture catches more than an untouched new-game snapshot.

## Invariants and exact test mechanisms

| Area | What is checked | Evidence / limitation |
| --- | --- | --- |
| Provenance | `serializeSave(advanceTicks(createWorld(613,50),720), pending,2)` equals frozen decoded JSON byte-for-byte | runtime regeneration assertion, sourceCommit recorded |
| Parse / validation | `parseSave` and `validateWorld` run against frozen real raw save; malformed tile length/out-of-range destination fail | actual v5 validator; loader remains unchanged |
| Geometry | 2304 tiles; corners (0,0)=0, (47,47)=2303, (0,47)=2256; (48,0),(0,48), fractional coords invalid | boundary unit test in fixture suite |
| Seed, tick, RNG, IDs | exact manifest values + whole `worldSha256` and reserialization | includes every citizen/site/resource/event ID/reference/coordinate |
| Inventory/cash | validates nonnegative goods, world market conservation; `market.initialSupply === totalCurrency(world)`; whole-world SHA retains stock and trades | existing save validator + full-state hash |
| Households/social | 30 households, 913 directed edges, validator checks member references and social edge limits | real generated social state |
| Governance | 1 election, leader/policy/shock state validated and hash-pinned; real `pending` order with requestId=1, `nextRequestId=2` | real queued policy command, not a mocked replacement |
| Determinism | parse → 1 tick with pending command → 95 normal ticks; compare whole-world SHA-256 to pinned end tick816 and to second replay | v5 reference result; no wall-clock/Math.random |
| Atomic invalid saves | `parseSave` refuses malformed data without mutating source world | test hashes source world again; coordinator atomic import separately covered by existing suites |
| Save volume | exact 263,532 bytes, below current 8 MiB cap | measured at 50 NPC on this checkpoint, **not** a 96-map filesize prediction |

The test does **not** certify that arbitrary old engine versions other than the pinned `sim-v5-phase06` can be imported. It does not prove v6 migration (W02-E), 96 generation (W02-C) or PC GPU FPS (W02-F). Do not weaken existing v5 validation to force data through.

## How to reproduce (Node 22.12+, npm 10)

```bash
npm ci
npm run typecheck
npm run lint
npm run test -- src/persistence/legacy-v5.fixture.test.ts
npm run test
npm run build
npm run test:e2e
```

Reproduce the source baseline from the original engine commit with the fixture test's `generateSourceBaseline` path: seed 613, 50 population, advance 720 ticks, queue the actual current leader's emergency-food command for tick721, serialize, continue 96 hours, compute Node `createHash('sha256')` on raw save and JSON world. Pinned version fields and `nextRequestId` are part of the input. The frozen file has already been saved from the actual CI engine run; test **must fail** if fixture or manifest file is missing, corrupt or differs from reproduction.

## Execution evidence and open checks

- Main PR #15 post-merge `Tiny Civilization CI` [38861069823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861069823) **PASS** and `Pages` [38861069825](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861069825) **PASS**.
- W02-A initial fixture bootstrap [38861809236](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38861809236) **PASS** for npm ci, dependency audit, typecheck, lint, unit, build, E2E, Pages-path release smoke. **This initial run did not contain the frozen files; it does not pass the final mandatory frozen-fixture gate.**
- Final PR #16 CI outcome is documented in `W02_A_HANDOFF.md` and `docs/PROGRESS.md` once HEAD CI completes. The final gate requires a run on the **last commit containing both fixture files and the strict test**.
- Local shell `npm ci/typecheck/lint/test/build/test:e2e`: **NOT RUN**, because this chat execution environment cannot resolve github.com to clone the repository. CI runner, not local PC, supplies separately labeled test evidence.

**Carry forward into W02-E:** parse frozen v5, migrate to v6 with `map:{width:48,height:48}`, compare projected v5 world against exact `worldSha256`, then replay the 96-hour continuation with unchanged gameplay outputs/RNG and export/reimport v6. The original compressed source fixture must remain untouched.
