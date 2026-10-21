# Q07-C open evidence and UX risks

No browser-derived defect is claimed, because no live browser evidence was collected. No issue is marked FIXED merely from source review.

| Priority | Gap / potential defect | Verification needed | Owner |
|---|---|---|---|
| P1 verification gap | Follow/death/reset and pointer selection after resize untested on canvas | Q07-camera-follow-death actual browser interaction and console log | Q07-C manual |
| P1 verification gap | Weather clear/cloudy/rain/fog distinguishability not captured; particles-off rain not proven | Four captures at fixed tick/zoom, plus particles-off and post-rain | Q07-C manual |
| P2 verification gap | 4–6 distinct building silhouettes and three recognizable districts uncounted visually | Annotated overview and building close-up at three desktop viewports | Q07-C manual |
| P2 verification gap | HUD, inspector, POI label overlap, 4 day phases, audio and reduced motion not visually confirmed | Screen recordings plus console inspection | Q07-C manual |
| P1 outside current task | 60 FPS and stability on target hardware unknown | FPS/frame p95/heap and soak measurements | Q07-E |

Rollback: revert the Q07-C test/docs-only commit if CI regresses; no save or simulation migration applies. Do not modify frozen hashes to hide a failure.
