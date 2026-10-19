# E04-A → E04-B handoff: clock and observer experiment

## Status
Branch: `feat/e04-a-clock-observer-pace`. Baseline `main` = `aa9de47cdd7cfab1e87b8c3217e41c64e2ac12dc`; PR #28 merged; main Fast CI #39209568831 SUCCESS.

## Implemented E04-A
- Opt-in runtime-only Observer Pace selector: off / 5 / 10 / 15 minutes per game-day. Legacy 1×, 5×, 20× retain targets of 2/10/40 hours per real second; gameplay hour remains exactly one `advanceOneTick`.
- Pause, hidden-tab no catch-up, observer/hour publish and prior N03-F `renderPaths` remain in one coordinator. No engine, save schema, economic RNG, NPC decision, weather, ambient or lighting modifications.
- Detailed rationale and computed rate table in [ADR](E04_A_CLOCK_ADR.md).

## Verification
- Automated test coverage introduced for 24-tick day, seed+N tick digest equality across all six modes, runtime pause/hidden, transitions, true path adjacency, save/replay.
- Pre-final code-head [Fast CI #39211980594](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39211980594) **PASS** at `519f29ee`: 36 test files / 290 tests, 0 production audit vulnerabilities, typecheck/lint/build PASS. **This is not a PASS of the subsequent documentation+ordered-command-test commit; verify final exact-HEAD run in PR #29.**
- Local `npm ci`, audit, typecheck, lint, Vitest, build: **NOT RUN** in isolated execution container (GitHub/npm DNS unavailable).
- Optional Chromium/Playwright and physical PC 30s/5min experiments: **NOT RUN**. Do not present computed values as measured observations.
- Watchability status: **PARTIAL / not accepted**. A 450-ms render tween with 12.5/25/37.5-second gaps is likely too sparse; visual smoothness when switching mid-tween unverified. Observer mode remains opt-in, never default.

## E04-B entrance conditions
1. PR E04-A reviewed and explicitly merged after exact-head Fast CI PASS. Do not assume merged.
2. Keep simulation ticks/hour, legacy three speeds, new opt-in pace and saved world unchanged.
3. Implement **E04-B only**: dawn/day/dusk/night lighting and window/street lights driven from `hourOf(snapshot.world.tick)`, without inventing independent sky/game time; interpolate only presentation.
4. Check 48×48 legacy and 96×96 worlds, pause/resume, 20× flicker, zoom/follow and four hours 06/12/18/23; run Fast CI (no required browser) and document any optional manual screenshot or real-PC evidence honestly.
5. Do not add E04-C–F weather/audio/state migrations or Plan 05 ambient here; don't make Observer Pace the default without owner approval and 30s/5min evidence.

## Proposed prompt for next task
> TASK Tiny Civilization — E04-B Day/Night Lighting & Windows only. Read current main, E04-A ADR/handoff, Master/Plan 04, Simulation Contract, coordinator, WorldScene and N03-F renderPaths. Verify E04-A PR merged and post-merge Fast CI passed before branching. Create feat/e04-b-day-night-lighting; implement Phaser-only dawn/day/dusk/night visual layers and windows/street lights, with hour sourced solely from authoritative world.tick; preserve 1-hour ticks, all three legacy speeds, opt-in Observer Pace, PRNG, save, weather-free gameplay, N03-F render traces. Add unit/integration regression, test at 06/12/18/23 across 48/96 and document optional visuals honestly. Run mandatory Fast CI (npm ci/audit/typecheck/lint/test/build) on final commit. Create PR, do not merge or dispatch Full E2E/Pages; report SHA/CI, limitations, handoff to E04-C.
