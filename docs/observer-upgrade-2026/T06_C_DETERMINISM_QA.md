# T06-C — Determinism and T06-B regression gates

## Authoritative comparisons
- Frozen v5 50 NPC/seed 613/tick 720: same raw save digest, `canonicalV5Projection`, migration to 48×48 v6, pending command, exact v5 projection after 96 additional ticks (unchanged W02-A hashes).
- Existing 48×48 legacy suites: 20/50/100 NPC, multiple seeds, 1,000-tick continuous versus 500+save+reload+500 with ordered governance commands, economic conservation and exact full state.
- Existing 96×96 suites: ten seeds × all populations with 24-tick full-state split equality, and 240-tick split equality at seed 137 for 20/50/100 NPC.
- New T06-C: 48×48 v5→v6 migration at seed 101, 20/50/100 NPC, 240-tick continuous versus 120+save+reload+120, full world, market, citizens, governance and PRNG. Test format-2 synthetic hydration, RNG not consumed, format-3 roundtrip and pending command exact next tick.
- Existing `src/app/t06b.instrumentation.test.ts`: diagnostics ON/OFF equivalence at 48 and 96, 20/50/100, seeds 101/12345, speed/observer pace, shared coordinator leases, pause/hidden/resume and bounded telemetry. Assertions and source are not weakened.

## Execution status policy
Only final **exact SHA** PR GitHub Actions result can label these tests PASS. Fast CI has npm ci, production audit, typecheck, lint, Vitest and build, **not Playwright**. No local checkout is available in the execution environment, so local npm commands and Chromium are marked **NOT RUN locally**; use remote CI logs as the actual execution evidence. Any failures must be fixed and rerun before CODE VERIFIED.

## Limits
Generated checkpoints are not independent historical saves. The new format-2 cases are synthetic. Hardware timing, true browser localStorage exceptions and 60/120-minute soak need separately recorded tests in T06-E/F.
