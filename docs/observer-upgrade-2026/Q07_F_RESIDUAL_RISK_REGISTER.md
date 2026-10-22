# Q07-F residual risk register

Baseline: `main@71aedc08fce9b3e78cf2d4f5df296c16fb955809` (PR #52 merged); [post-merge Fast CI](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39714112744) completed/success on exact merge SHA. Q07-F branch: `feat/q07-f-release-review`. Review date: 2026-10-22. Q07-F final-head CI must be verified separately; this baseline CI does not verify Q07-F changes.

| Risk | Likelihood | Impact | Severity | Mitigation | Gap | Owner | Action | Release block |
|---|---|---|---|---|---|---|---|---|
| Save integrity | Low | Critical | High | Atomic validation and 3-format regression | Live storage quota/denial missing | Persistence | PC export/import + backup before reset | Yes for final full GO |
| Determinism | Low | Critical | High | 12 immutable hashes, replay tests | Q07-F exact-head CI pending | Simulation | Retain hashes; inspect any failure | Yes if fails |
| Economy | Low | Critical | High | Currency/inventory governance tests | Long PC progression not observed | Simulation | Reproduce issue before changes | Yes if corruption |
| Population scaling | Medium | High | High | 20/50/100 suites | Hardware scaling absent | Performance | Profile target PC | Yes for full GO |
| Rendering | Medium | Medium | Medium | Visual/lighting tests | No actual screenshot ledger | Visual QA | Capture viewports | Conditional |
| Performance | Unknown | High | High | Node benchmark harness | FPS/frame p95 NOT MEASURED | Performance | Measure named PC | Yes for full GO |
| Resource lifecycle | Unknown | High | High | Coordinator cleanup source/tests | Real 60–120m soak NOT RUN | Reliability | Soak + 0/15/60/120 samples | Yes for full GO |
| Watchability | Unknown | High | High | Virtual category reducer test | No human-rendered timeline | Observer QA | Record sessions | Yes for full GO |
| Camera | Medium | High | High | Camera geometry/AFK test | Real click/resize/follow absent | Camera QA | Manual desktop validation | Conditional |
| Weather | Medium | Medium | Medium | Weather/shelter/audio tests | No four-state captures | Visual QA | Capture weather | Conditional |
| Audio | Medium | Low | Low | Sound model tests | No device mute/unlock listening | Audio QA | Local PC listen | No unless crash |
| Offline runtime | Low | High | Medium | No backend dependency; local Vite scripts | Offline browser cold run not logged | Local UX | Offline localhost smoke | Conditional |
| Compatibility | Medium | High | High | Legacy format 1/2 plus current 3 parser | Physical old-save restore not observed | Persistence | Import backup fixture on PC | Conditional |
| Manual evidence | Certain | High | High | Owner reports qualitative PC smoke PASS | No video, FPS, long soak, console logs | Owner/QA | Complete evidence ledger | Yes for full GO |

Impact/likelihood are qualitative review estimates, not empirical failure rates. Release-block rows refer to **evidence gates** unless a concrete defect is reproduced. Do not automatically classify unmeasured FPS as proven P1 performance bug.
