# E04-F — Plan 04 completion gate and Plan 05 handoff

**Branch:** `feat/e04-f-integration-pacing-validation`. **Target:** `main`. **No automatic merge or GitHub Pages deploy.**

## What is implemented

- Reused two existing E04-F test files and extended cross-phase Node and Chromium matrices.
- Hour-by-hour path validation, resource/wealth conservation and 72-hour replay.
- Read-only live Phaser FPS, render object, texture and routing diagnostics.
- Short browser profiler, 24 screenshot matrix, audio/camera/pacing lifecycle scenario.
- Opt-in 60/90/120-minute real-wall-clock soak test and manual Full E2E artifact collection.
- Integration/performance/visual-audio documentation with explicit evidence limits.

## Admission checklist

| Gate | Status at handoff authoring |
|---|---|
| E04-E merged and post-merge Fast CI | PASS, `201f20c6` and run #39350374219 |
| E04-F tests, typecheck, lint, build on final HEAD | NOT RUN until PR CI has completed |
| Chromium visual screenshots and E2E | NOT RUN, workflow manual only |
| Windows PC audible audio and manual visual acceptance | NOT RUN |
| 60–120 min hardware soak | NOT RUN |
| Memory/texture leak-free claim and 60 FPS | NOT MEASURED |
| PR review | Pending |
| Merge into main | **Forbidden** until explicit user approval |

**Overall E04-F status:** **PARTIAL / NOT YET ACCEPTED**. Do not mark Plan 04 complete simply because the Fast CI becomes green. A draft PR is appropriate until evidence gates are fulfilled or the owner explicitly approves a documented narrower acceptance.

## Required next actions

1. Verify Fast CI `checks` status and exact head SHA; fix failed tests without suppressing them.
2. Trigger **Tiny Civilization Full E2E (manual)** from GitHub Actions on this branch. Inspect logs and download `observer-e04-f-evidence` within the artifact's seven-day retention.
3. On Windows PC, run `npm ci`, `npx playwright install chromium`, and E04-F Chromium spec. View screenshots and listen to actual Web Audio. Record OS, browser, GPU and reproducible steps.
4. Run `E04F_SOAK_MINUTES=60` on physical PC with monitored heap/GPU/texture trends; annotate actual wall time and any errors.
5. Update evidence files with real numbers only. Review PR and ask owner before merging. **Plan 05 must remain gated** by accepted Plan 04 conditions.
