# Q07-D — Watchability Study implementation (2026-10-22)

## Preflight
- Base `main@cae75df7695ab6bff1e869b1135d86b1de5be43e`; PR #50 merged on 2026-10-21.
- Post-merge [CI #39575483638](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39575483638): completed/success, exact base SHA.
- Branch `feat/q07-d-watchability` from that SHA; Draft PR only. No deploy or merge.

## Source audit and provenance
- `ambient/catalog.ts` derives candidates from real site/POI/road/citizen anchors and current WorldState with catalog phase/weather gates. Synthetic fixture `three-categories-5min` deliberately rewrites test-world tick to 7 and virtual time to 300000ms; it is NOT a naturally observed 5-minute session.
- `ambient/director.ts` picks one candidate per 8-second virtual presentation interval; has cooldown, per-anchor budget, duplicate suppression and reduced-motion gates. `inCamera` is an anchor-based forecast, not render proof. `metrics.renderedActors` is hard-coded zero.
- `ambient/visuals.ts` creates bounded Phaser handles after camera culling; its historical `renderedCategories` metrics represent creation, not necessarily five-minute human observation. Moving actor position may diverge from the initial anchor forecast.
- `ambient/runtime.ts` maintains session-local maps, limited cooldown registry and counters. `director.dispose()` and `visuals.dispose()` release their own references. This source inspection is not a hardware leak measurement.
- `camera/afkDirector.ts` ranks real productive NPCs and events, excludes dead targets and uses idle gates; source logic alone is not proof of comfortable real camera movement.
- No change to camera director, gameplay RNG, weather RNG, economic ownership, WorldState, save or fixtures.

## Added evidence gate
`ambient/watchability.ts` is a pure reducer over **explicit observation records**. A category counts only when on camera, rendered, observed and inside the measured window; repeated identities/categories do not inflate the unique category total. `q07d.watchability.test.ts` exercises category deduplication, ineligible observations and synthetic-vs-actual distinction. Callers must NOT synthesize `observed: true` from scheduler metrics. No in-game telemetry or video recorder is asserted.

## Acceptance boundary
30s, 5-minute and 20–30-minute *real* sessions: NOT RUN without desktop browser+recording evidence. Automated/virtual fixtures do not close QA-08. Q07-E performance and Q07-F release are out of scope.
