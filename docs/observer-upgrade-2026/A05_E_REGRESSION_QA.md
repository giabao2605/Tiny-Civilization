# A05-E — Regression & Determinism QA

| Contract | Automated source evidence | Status |
| --- | --- | --- |
| Renderer does not mutate `WorldState` / `rngState` / `weatherRngState` | `ambient.test.ts`: 72-tick dual-world replay with ambient work on/off; director and registry tests JSON-read-only | PARTIAL pending final Fast CI |
| v5 frozen 48, migrated v6 48, native v6 96 (20/50/100) | Existing `ambient.test.ts`, `director.test.ts`, `visualModel.test.ts`; no save format edits | PARTIAL pending final Fast CI |
| Cooldown, fairness and offscreen visibility | Director unit tests + new bounded visible-district ranking coverage | PARTIAL pending final Fast CI |
| Real cart routes, rain-end puddles, authentic NPC conversations | Existing catalog/route validation tests, code unchanged | PARTIAL pending final Fast CI |
| Bounded visuals and cleanup | Registry create/cull/reenter/clear double-clear test, maxActive=4 | PARTIAL pending final Fast CI |
| Audio unlock, one-shot dedupe and scene lifecycle | A05-D unit tests / mixer unchanged by A05-E | PARTIAL pending final Fast CI |
| Pause, hidden, reduced motion, no backlog | Existing director tests; physical browser foreground/background not repeated here | PARTIAL |
| Camera framing/pan/follow/AFK and resize | Existing E04-F/N03-F E2E test sources; **not run** during A05-E | NOT RUN |
| Real canvas, console errors and visual identifiability | New optional 5-minute E2E source; no execution screenshot proof yet | NOT RUN |
| FPS/soak/physical headphone check | Requires measurement or operator | NOT RUN / NOT MEASURED |

No golden snapshots changed, no Vitest assertions skipped to obtain a pass. The fixture modification advances its **test starting hour only** to 07:00 so an actual existing market-opening candidate can coexist with wildlife and domestic visuals. It does not fake NPC social contact, economic trade or any WorldState change in the game runtime.

Exact final branch commit and GitHub Actions result must be verified after documentation lands. A successful Fast CI can convert the automated portions to PASS but **must not** convert unrun browser/device/performance gates to PASS.