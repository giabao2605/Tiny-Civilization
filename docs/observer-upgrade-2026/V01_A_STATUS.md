# Observer Upgrade 2026 | V01-A execution status

**Date:** 2026-10-15  
**Work item:** V01-A — Baseline & Visual Audit.  
**Source:** `main@e7d0b943` (Observer PR #10 merged).  
**Implementation branch:** `audit/v01-a-visual-baseline`.  
**Status:** **PARTIAL — source audit + Art Bible + V01-B handoff committed; new-branch screenshot/visual evidence subject to CI artifact verification.** NOT a G0/T06-A sign-off.

## Deliverables

1. [Source-grounded visual audit](V01_A_AUDIT.md): actual camera/input, render/depth/lifecycle inventory, code locations, defect priorities, evidence boundary.
2. [Art Bible](ART_BIBLE.md): style lock, precise swatches, 12px-scale/6 silhouettes/road-water-forest/props, occlusion and pixel crispness, performance/license constraints.
3. [V01-B handoff](V01_B_HANDOFF.md): typed API proposal, file ownership, test matrix, admission gate and copy-paste task text.
4. `tests/e2e/observer-v01-a.spec.ts`: automated 1366×768 / 1920×1080 / 2560×1080 screenshots (seed 12345, actual paused tick logged); wheel, drag, one-canvas-remount checks; metadata JSON.

**Production game code modified?** NO. **Engine/save/schema changed?** NO. **Old Phase 00–08 docs changed?** NO.

## Tests and environment attribution

| Command / verification | Local V01-A workspace | GitHub Actions on pre-work MAIN `e7d0b943` |
| --- | --- | --- |
| `git clone` | FAIL — DNS `Could not resolve host: github.com`; no checkout | Checkout PASS |
| `npm ci` | NOT RUN — no checkout/dependencies | PASS |
| `npm run typecheck` | NOT RUN — no checkout | PASS |
| `npm run lint` | NOT RUN — no checkout | PASS |
| `npm run test` | NOT RUN — no checkout | PASS |
| `npm run build` | NOT RUN — no checkout | PASS |
| `npm run test:e2e` | NOT RUN — no checkout/Chromium context | PASS (original tests only) |
| V01-A new screenshot spec | NOT RUN locally | **PENDING independent PR CI evidence** |
| PC physical device benchmark | NOT RUN | NOT VERIFIED |
| Screenshots personally inspected | NOT RUN | NOT VERIFIED until artifact download/inspection |

**Pre-work main CI:** [Tiny Civilization CI #38690161727](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38690161727). [Pages #38690161742](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38690161742). Main workflow checks were read by GitHub API; PASS belongs to main, not automatically to this branch.

## Remaining requirements before approving V01-A and starting V01-B

- [ ] Confirm PR branch CI full test suite and new V01-A screenshot test PASS, with exact run ID.
- [ ] Download CI artifact containing `test-results/v01-a-...` and JSON metadata; confirm the screenshot images are **real** and inspect tree/road/house/NPC/occlusion/zoom/HUD at three viewport sizes.
- [ ] Record screenshot filenames/artifact URLs in this file; compare camera default/zoom/drag and document subjective findings separately from source-audit hypotheses.
- [ ] If G0/T06-A owner requires baseline performance measurement before V01-B, obtain same-runner 20/100 NPC FPS/frame p95 measurement; prior Phase 06 ~25 FPS is historical, not current branch measurement.
- [ ] Get human review acceptance; no automatic phase completion from a green CI badge.

## Scope and rollback

Do not merge automatically. Reviewer can roll back this documentation/test PR without changing live simulation, save compatibility or render behavior. Do not use status of V01-A to claim the whole Observer Upgrade (G1) is shipped.
