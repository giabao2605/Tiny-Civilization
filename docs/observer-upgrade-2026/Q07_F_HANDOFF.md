# Q07-F owner handoff

Baseline: `main@71aedc08fce9b3e78cf2d4f5df296c16fb955809` (PR #52 merged); [post-merge Fast CI](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39714112744) completed/success on exact merge SHA. Q07-F branch: `feat/q07-f-release-review`. Review date: 2026-10-22. Q07-F final-head CI must be verified separately; this baseline CI does not verify Q07-F changes.

Draft PR targets `main`; do not merge or deploy automatically. After final-head CI exact-sha succeeds, review the QA matrix, risk register and NO-GO recommendation. For PC-local use run `npm ci && npm run dev`, or `npm run build && npm run preview` (read actual Vite URL). Source runtime does not depend on backend/Pages.

**Next owner action:** independently review Draft PR and CI, then capture named-PC viewport/FPS/frame p95, 30s/5m/20–30m rendered event timeline, 60–120m resource samples, save import/export with denied/quota handling, camera/weather/audio smoke. Record seeds, tick, map, population, speed, OS, hardware, browser, date and console errors. Keep backup JSON; do not erase localStorage before export.

**Rollback/recovery:** Do not modify `main` until review; revert Q07-F documentation commit if needed. For a future runtime regression revert the smallest faulty PR/commit rather than overwriting saved data or golden fixtures. Save a format-3 JSON backup and a real legacy file before risky import tests; an invalid import should leave live state untouched. Do not alter frozen golden hashes to force a green build.
