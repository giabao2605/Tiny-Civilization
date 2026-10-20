# T06-C — Golden fixtures, provenance and limits

## Immutable genuine v5 baseline
- Frozen raw envelope: `tests/fixtures/legacy-v5-48x48.json.gz.b64`, gzip + base64 storage only.
- Manifest: `tests/fixtures/legacy-v5-48x48.expected.json`.
- Original engine/source commit: `4149442f026be2f404c249511fdbc9ad2b7f5867`.
- v5 format 1 / `sim-v5-phase06`; seed **613**, population **50**, tick **720**; 48×48, **263,532 UTF-8 bytes**; 1 queued request, `nextRequestId=2`.
- Frozen envelope SHA-256: `d092ab398c3522493d67a5b2f3b83520d42f577fc7ef9f3bb240d45f3a4d40c9`.
- Frozen world SHA-256: `4450cd0df0bb29e708c2ecf89f4beeff6130acc8cb2c50e4512ccf3640ad0ea1`.
- Frozen continuation world SHA-256, 96 ticks later: `0b97eb5f20f2af3004c5f153441e5acee331e727aa9b4e3d5c20277f786ad12d`.
- These expected bytes and hashes are **not modified**. Existing `legacy-v5.fixture.test.ts` and `v6.test.ts` check parser, migration, full v5 projection SHA and tick 720→816.

## Broader compatibility/regression matrix
- Frozen historical v5 user-style bytes exist only for 48×48/50 NPC/seed 613. **No evidence of authentic historical v5 bytes for 20 or 100 NPC**. Never label reconstructed saves as archived user files.
- Existing `save.test.ts`: generated legacy v5 20/50/100 × seeds 210/613, 1,000-tick uninterrupted/split replay; this is generation, not independent historical fixtures.
- Existing `v6.test.ts`: current 96×96 20/50/100 × ten seeds (24-tick), and 240-tick replay at seed 137 for each population.
- New `t06c.integrity.test.ts`: migrated v5→v6 48×48 20/50/100, seed 101, 240-tick exact replay; format-2 synthetic 48/96 at seed 12345; command and weather RNG invariants.
- New `t06c.golden.test.ts`: original-engine-generated tick 24 checkpoints on 48/96 × 20/50/100 × seeds 101/12345. These are **reproducible engine-derived candidate goldens**. Capture the printed SHA-256 from actual CI, pin immutable expected values, and then treat them as independent regression locks; do not assert hashes are already frozen before that step.

## Evidence policy
A test recomputing its expected hash from the same actual state is only a smoke/roundtrip check, **not a cryptographic golden lock**. Keep historic v5 manifest separate. Record exact candidate commit and CI run in `T06_C_HANDOFF.md`. Do not fabricate a historical format-2 fixture: the new pre-weather envelope matrix is synthetic and accurately labeled.
