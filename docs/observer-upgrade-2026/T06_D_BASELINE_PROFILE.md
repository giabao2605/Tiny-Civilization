# T06-D baseline profile (incomplete)

Base: main@00e8706998d3c55d195ad06242ad1eb3c01d7b46 (PR #43 merged). Post-merge CI #39399807790 SUCCESS on exact SHA. Date: 2026-10-21.

## Source audit
- WorldScene.create() paints terrain/layout and creates node markers and citizen objects. Static terrain uses a Graphics object in paintTerrain(); this is not evidence that 9,216 individual Game Objects are created.
- WorldScene.setSnapshot() updates only changed resource stock graphics; adds citizen tweens for visual movement; restarts the scene when geometry/seed/population changes.
- Scene SHUTDOWN unsubscribes input, visibility and reduced-motion listeners; disposes ambient director/visuals/weather layer and removes generated lighting textures. Runtime leak absence is not yet demonstrated.
- livingCoordinator batches published UI worlds: 1 tick per paint at 1x, 2 at 5x, 4 at 20x. These are presentation snapshots, not skipped simulation ticks.
- observerMetrics collects tick and publish-gap diagnostics. Browser frame metrics exist separately; tick time is not FPS.
- scripts/observer-benchmark.ps1 runs headed Playwright scenario; script itself does not certify GPU FPS.

## Measurement ledger
All requested hardware/browser measurements: **NOT MEASURED**. No comparable baseline runs were performed. GitHub connector can read source but the local terminal cannot resolve github.com, so repository checkout and its npm test/benchmark were not possible in this session. Do not infer an FPS baseline, bottleneck, or improvement from static inspection.

Required future runs: map 48/96; population 20/50/100; seeds 101/12345 and stress 3; speed 1/5/20; observer pace 5/10/15 when relevant; camera fit/follow/zoom/pan; viewports 1366x768 and 1920x1080; effects/diagnostics on and off. Use genuine 48x48 save/fixture. At least three comparable samples with warmup; capture machine, Chromium version, GPU, CPU, RAM, commits, sample duration and memory context.
