# T06-D paired before/after method and evidence

- Baseline: `main@00e8706998d3c55d195ad06242ad1eb3c01d7b46` with benchmark test copied unchanged from candidate, not different instrumentation.
- Candidate: feature branch, exact SHA recorded in `T06-D Headless Browser Profile` CI logs and artifact.
- Same GitHub-hosted Ubuntu 24.04 runner in one workflow job; Node, CPU and browser version disclosed by job. 96x96/100 NPC/seed12345/1920x1080, 1x/20x, fit/zoom/follow, effects on/off, three 500ms-warmed 1100ms rAF samples.
- Metrics: rAF FPS and frame p95, Phaser object count, texture count, forest visible total (candidate), weather/ambient counters, coordinator tick/routing metrics from DEV instrumentation. CPU tick/save bytes in independent Fast CI.
- **Browser baseline/candidate values PENDING paired workflow**. No percent improvement claimed from incomplete samples. Do not infer physical GPU performance from headless runner.
- Caution: runs compare reset seed/world and camera, but frame scheduling/world ticks while running may diverge under different speed/CPU load. Evaluate significant regressions before keeping culling. Source commit is purely presentation; simulation metrics should not be interpreted as optimization of routing.
