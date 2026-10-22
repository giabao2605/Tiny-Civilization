# P08-A Feasibility review

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

## Decision: CONDITIONAL

Q07-F product acceptance remains NO-GO (0 PASS, 9 PARTIAL, 0 FAIL, 2 NOT RUN, 1 NOT MEASURED). Owner PC smoke is qualitative only. Phase-08 expansion spec explicitly requires convincing 30–180-day watchability, measured performance headroom, value from trade/conflict and owner scope acceptance. These are not established. No reproducible P0/P1 is documented, but missing evidence is not a PASS.

The 96×96/100-NPC N03-F 720-hour Node p95 (weighted) for seeds 101/107/12345 was 13.019/12.180/14.499 ms. These are simulation-only CI-runner numbers, not on-device FPS, memory or two-world estimates. Early 72-hour watchability showed sparse productive/event-POI activity. A lightweight second settlement may reduce render load, but remains hypothetical.

Compare product options: two villages with genuine trade could show divergent scarcity, transport interruption, price changes and interdependence; improving NPC stories, event comprehension and economic tuning within one village has lower migration/performance risk. No player preference is proven.

Allowed now: architecture, ADR, evidence and isolated future prototype planning. Not allowed: production engine/save/UI multi-settlement changes. Owner must explicitly accept gate exceptions or supply missing observations before integration.
