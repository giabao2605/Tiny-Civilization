# Q07-D known issues / unverified gates

- **P1 / QA-08 open:** No 30-second, five-minute or 20–30-minute desktop recordings. Real watchability is NOT RUN, not PASS.
- **P2 / instrumentation limitation:** `AmbientDirector.metrics.visible` and `inCamera` are forecasts; `AmbientVisuals.metrics.renderedCategoryCount` is lifetime handle creation. Neither proves unique categories truly observed in a defined real-time window. Do not count them as product acceptance.
- **P2 / possible observer gaps:** Source shows ambient selection is limited to one start per virtual 8s; actual camera visibility, occlusion, quiet intervals and category repetition require video evidence before a gameplay fix.
- **Not measured:** FPS, frame-time percentiles, memory or resource leak slopes, hardware soak. Q07-E owns performance.
- **No confirmed runtime defect** attributable to Q07-D source audit meriting speculative balance/camera changes. Any later fix needs reproduction seed/tick, expected/actual, regression and before/after evidence.

Rollback: revert Q07-D observation utility, tests and documents; no canonical schema or gameplay fields were changed.
