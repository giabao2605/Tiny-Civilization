# Q07-A deterministic fixture manifest

Machine-readable source: [Q07_A_FIXTURE_MANIFEST.json](Q07_A_FIXTURE_MANIFEST.json). This is a plan, not proof of execution. 96×96: **101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 12345**, populations **20/50/100**, **33** planned cases. Existing `src/sim/world96.test.ts` already iterates 10 seeds × 3 populations; added seed 12345 here as a future explicit case rather than asserting it was run. Legacy 48×48 format-1 comes from `tests/fixtures/legacy-v5-48x48.json.gz.b64`. Format-2 is historical/synthetic, never pretend it is a captured player save. Format-3 is the current v6 writer.

Frozen **12** checkpoints are referenced, never regenerated: `tests/fixtures/t06c-engine-checkpoints.expected.json`. Do not edit either golden file or source simulation. Weather: clear/cloudy/rain/fog. PC viewports: 1366×768, 1920×1080, 3440×1440. Speeds: paused, 1×, 5×, 20×. Record observer pace separately. 200 NPC is *synthetic benchmark only*.

## Reproduction recipe

1. Record exact Git SHA, Node/browser/OS/hardware, fixture ID, initial seed/population/map, starting tick, command queue, pace and virtual vs real elapsed time.
2. For natural cases call the existing world constructor, enqueue canonical commands and execute `advanceOneTick` sequentially N times. Compare canonical world digest/events against an independent repeated execution; never use render FPS as simulation clock.
3. Test-only barriers, artificial rain, co-location and ambient fixture context must be explicitly labeled synthetic, kept isolated from saved/live production state.
4. For manual PC tests run `npm run dev`, open localhost, set viewport and record screenshot/video with timestamp, tick/hour/weather and console warnings. An unrecorded outcome is **NOT RUN**.
5. Existing test commands: `npm run test`, or `npx vitest run src/sim/world96.test.ts src/persistence/t06c.golden.test.ts`. Run only when environment is available. Do not install Chromium automatically.

## Scenario catalogue

| ID | Seed / NPC / map | Tick span | Setup & expected | Existing test | Status |
|---|---|---|---|---|---|
| Q07-normal-life | 101 / 20 / 96×96 | 0–48 | Natural creation; observe daily schedule; work/home/needs; capture reason and tick | `src/sim/engine.test.ts` | PARTIAL |
| Q07-work-home | 103 / 50 / 96×96 | 0–48 | Natural replay; Commute obeys route and clock | `src/sim/n03d.routines.test.ts` | PARTIAL |
| Q07-market-visit | 107 / 20 / 96×96 | 0–72 | Natural replay; Trade debits/credits correct owners | `src/sim/economy.test.ts` | PARTIAL |
| Q07-social-encounter | 109 / 50 / 96×96 | 0–72 | Natural replay; Social graph stable and replayable | `src/sim/social.test.ts` | PARTIAL |
| Q07-blocked-route | 109 / 20 / 96×96 | 0–2 | TEST-ONLY set water barrier at x=70; Finite path failure; no teleport | `src/sim/world96.test.ts` | PARTIAL |
| Q07-unreachable-target | 113 / 20 / 96×96 | 17–19 | TEST-ONLY water at owned home; BlockedGoal and retryAfterTick | `src/sim/weatherShelter.test.ts` | PARTIAL |
| Q07-rain-shelter | 1 / 100 / 96×96 | 17–19 | TEST-ONLY weather rain intensity .95 and needs prepared; Return to owned home, preserve cash | `src/sim/weatherShelter.test.ts` | PARTIAL |
| Q07-weather-transition | 127 / 20 / 96×96 | 0–96 | Natural weather RNG replay; Four state enum and deterministic transitions | `src/sim/weather.test.ts` | PARTIAL |
| Q07-ambient-virtual | 107 / 20 / 96×96 | 7–12 | TEST-ONLY ambient fixture three-categories-5min; virtualMs 300000; Candidate categories only; rendered UX unverified | `src/game/ambient/ambient.test.ts` | PARTIAL |
| Q07-camera-follow-death | 131 / 20 / 96×96 | 0–48 | Manual follow selected ID, death/reset then resize; Follow disengages safely, no jump | `src/game/camera/afkDirector.test.ts` | NOT RUN |
| Q07-governance-pending | 137 / 50 / 96×96 | 0–48 | Queue valid governance command; Pending IDs and nextRequestId survive roundtrip | `src/sim/governance.test.ts` | PARTIAL |
| Q07-legacy-v5-import | 101 / 20 / 48×48 | 0–24 | Read genuine compressed legacy fixture, format 1; Retain IDs, inventory, economy; migrated stays 48 | `src/persistence/legacy-v5.fixture.test.ts` | PARTIAL |
| Q07-invalid-json | 101 / 20 / 96×96 | 0–0 | TEST-ONLY malformed JSON input; Atomic rejection; live state unchanged | `src/persistence/save.test.ts` | PARTIAL |

Status **PARTIAL** means an existing test covers a component but the complete scenario has not been verified on this branch. Candidate ambient categories are not proven rendered event categories. No synthetic WorldState modifications may count as natural events.
