# V01-E — QA and visual evidence

**PR:** [#15](https://github.com/giabao2605/Tiny-Civilization/pull/15) (Draft).
**Final source tested:** `c1db2c1354a3063586a15ab580288a9736e359ec`.
**Verified final workflow:** [38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446) **SUCCESS**.

## Automated gate evidence

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` and production `npm audit` | PASS | final CI workflow |
| `npm run typecheck`, `npm run lint` | PASS | final CI workflow |
| `npm run test` | PASS (96 tests / 16 files) | final CI workflow |
| `npm run build` | PASS | final CI workflow |
| `npm run test:e2e` | PASS (27 passed, 1 skipped, **0 flaky retries**) | final CI workflow |
| Pages-path production build + release smoke | PASS (1 Playwright test) | final CI workflow; deployment not required for this task |
| 54-case rAF/p50/p95/heap matrix | EXECUTED; performance acceptance PARTIAL | `v01-e-ci-matrix.json`, baseline/final |
| 6× repeated canvas remount, paused save equality | PASS sample; long-run memory PARTIAL | `v01-e-remount-counts.json` |
| 3 viewport overview + close-up, selected paused, Follow, AFK two POIs | SCREENSHOTS CAPTURED AND VISUALLY INSPECTED; subjective PC animation PARTIAL | V01-E PNG evidence |
| Follow four bounds, resize and control transitions | PASS automated for nearest real NPC per side and pre-existing V01-D camera regression; actual tile positions recorded; **not** guaranteed actual border tiles | `v01-e-nearest-*-npc.png` and Playwright logs |
| Physical Windows 60 FPS, 60–120 min soak, hidden-tab behavior on device | NOT RUN / PARTIAL | PC access required |

Prior intermediate branch CI red builds are **not** final HEAD: two failures were a strict tuple TypeScript error in the new edge test, later fixed; another 100-NPC/20× Playwright smoke timed out on screenshots/click action and one legacy governance smoke had a flaky retry under loaded CI. None justify claiming the final code failed or is universally stable; final HEAD run has no flaky retries.

## Visual review notes

Actually opened the PNGs from baseline and final-run archives and examined overview/close-up and Follow images. Overview at 1366×768, 1920×1080 and 2560×1080 keeps the map inside the canvas; final overview hides the distracting numeric labels; at close zoom they reappear. Selected highlight is captured on paused NPC and follows its actual sprite, including a remount test. No obvious duplicate canvas, missing ground texture or catastrophic occlusion in sampled screenshots; hard-edged pixel art remains visible.

The screenshot artifacts include:
- `v01-e-overview-1366x768.png`, `-1920x1080.png`, `-2560x1080.png`
- `v01-e-closeup-buildings.png`, `v01-e-selected-paused.png`, `v01-e-follow-paused.png`
- `v01-e-nearest-left-npc.png`, `right`, `top`, `bottom`
- `v01-e-afk-point-a.png` and `v01-e-afk-point-b.png` after the real 9-second scene cooldown

**Remaining:** screenshots cannot demonstrate tween smoothness/absence of flicker, physical near-edge camera jitter, long-run depth correctness for traveling sprites, actual NPC moving in front/behind every prop/building, tab background/resume on the user's machine or FPS stability. No screenshot has been presented as proof of those. Full map occupancy remains restricted to original 48×48; expansion belongs to Plan 02.

## Rollback & next quality gate

Keep PR Draft. No `src/sim` or persistence schema changes; rollback PR without save migration. Plan 01 should remain **PARTIAL**, not DONE, until hardware FPS and sustained soak are independently accepted or recorded as an explicit waiver. See [performance](V01_E_PERFORMANCE.md) and [handoff](V01_E_HANDOFF.md).