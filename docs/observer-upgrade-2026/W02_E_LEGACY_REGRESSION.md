# W02-E — Frozen legacy v5 regression

**Golden fixture files are unchanged.** The historical baseline is from source commit 4149442f026be2f404c249511fdbc9ad2b7f5867.

## Expected fixed values, not regenerated

- Seed 613; original 50 NPC at tick 720; 2304 terrain cells; one queued food-aid command; next request ID 2.
- Original file SHA-256: d092ab398c3522493d67a5b2f3b83520d42f577fc7ef9f3bb240d45f3a4d40c9
- Original full-world SHA-256: 4450cd0df0bb29e708c2ecf89f4beeff6130acc8cb2c50e4512ccf3640ad0ea1
- Continued full-world tick 816 SHA-256: 0b97eb5f20f2af3004c5f153441e5acee331e727aa9b4e3d5c20277f786ad12d

src/persistence/legacy-v5.fixture.test.ts now explicitly calls parseLegacySave. This still parses and reserializes the authentic v5 bytes and compares all original expected hashes. The new v6 test loads the same original frozen JSON with production parseSave, requires 48×48 v6, compares canonicalV5Projection full-world SHA-256 at tick 720, advances the pending command and 95 more ticks, then checks the frozen tick-816 SHA-256. This preserves the semantics of the original test while permitting production migration.

No expected digest, golden fixture, old economy formula, social rule, PRNG or governance policy is changed to make an assertion pass.

**Verification:** final PR HEAD test output pending. If hashes diverge, status remains BLOCKED.