# Q07-E performance matrix

| Map | NPC | Seeds | Speed | Viewports | Node simulation | Desktop FPS |
|---|---|---|---|---|---|---|
| Legacy v5 48×48 | 20/50/100 | 101, 12345 | pause, 1×/5×/20× | 1366×768, 1920×1080, 3440×1440 | NOT MEASURED in Q07-E | NOT MEASURED |
| Native v6 96×96 | 20/50/100 | 101,107,127,12345 | pause, 1×/5×/20×, Observer Pace where supported | same three | NOT MEASURED in Q07-E | NOT MEASURED |
| Synthetic stress | 200 | — | — | — | NOT RUN: supported population cap is 120 | NOT RUN |

Existing `src/sim/benchmark.test.ts` measures 720 ticks at 100 NPC with Node performance.now() and pathfinding diagnostics. It is not a PC FPS test. No fresh run or timestamped tick samples captured in this task. Hardware/browser/OS/CPU/GPU and FPS/frame time unavailable, so QA-10 cannot PASS.
