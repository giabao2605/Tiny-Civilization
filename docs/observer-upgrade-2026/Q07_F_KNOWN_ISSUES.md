# Q07-F known issues and evidence gaps

Baseline: `main@71aedc08fce9b3e78cf2d4f5df296c16fb955809` (PR #52 merged); [post-merge Fast CI](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39714112744) completed/success on exact merge SHA. Q07-F branch: `feat/q07-f-release-review`. Review date: 2026-10-22. Q07-F final-head CI must be verified separately; this baseline CI does not verify Q07-F changes.

**Confirmed P0: 0; confirmed P1: 0; confirmed P2/P3: 0 from this review.** This is not a claim that the application is defect-free. Evidence shortfalls below are OPEN acceptance gates, not reproduced defects.

| Gap | Reproduction / fixture | Expected vs actual evidence | Classification | Owner / corrective action |
|---|---|---|---|---|
| QA-08 real watchability | Seed 107 fixture then natural seeds 101/127, 96×96, 20 NPC; 30s/5m/20–30m | Timestamped visible distinct categories vs no capture | P1 acceptance risk, unconfirmed defect | Observer QA: capture actual events |
| QA-10 desktop FPS | 20/50/100, native 96 and legacy 48, three viewports | Target 60 FPS, p95 frames vs NOT MEASURED | P1 evidence gate, no proven frame-stall | Performance QA: capture hardware samples |
| QA-11 resource soak | 60–120 min local PC, repeated reset/save/load | Stable errors/resources vs NOT RUN | P1 evidence gate, no proven leak | Reliability QA: capture lifecycle/memory |
| QA-09 browser storage failures | Import malformed and quota-denied browser storage | Preserve live WorldState and prior good save vs no browser log | P0 risk if reproducible, not confirmed | Save QA: validate with exported backup first |
| QA-01/02/06/07/12 manual visuals/camera/audio/UX | 1366×768/1920×1080/3440×1440, time 06/12/18/23, four weather states | Acceptable observer UI vs absent screenshot and interaction log | P1/P2 review gap | PC reviewer |

If a test reproduces save corruption, deterministic mismatch, or economy loss, treat as P0, freeze release, preserve seed/save/log, open corrective PR. For a real crash or unusable camera, classify P1 and fix with regression. No speculative issue creation for a failure not observed.
