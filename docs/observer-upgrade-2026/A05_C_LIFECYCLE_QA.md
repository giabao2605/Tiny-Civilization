# A05-C — Lifecycle & isolation QA

| Scenario | Expected invariant | Verification |
| --- | --- | --- |
| Start -> render -> end | unique ambient ID maps to one handle, then destroyed | Pure registry test; Phaser lifecycle inspection outstanding |
| Weather cancellation | director reconciles, scene sync destroys handle in same snapshot | Director test + source integration |
| NPC leaves/dies | director rejects pair/citizen anchor, no fake NPC animation | Director test + source integration |
| Seed reset / same-tick import | scene.restart triggers SHUTDOWN disposal, fresh adapter | Static source verification; browser not run |
| Unmount / re-render | scene owns adapter, no independent listener | Static source verification |
| Offscreen pan/zoom / return | cull destroys, return may create one handle | Pure registry test; camera manual QA pending |
| Paused/hidden | clock doesn't run or backlog; no hidden frame allocations | Director tests + scene code |
| Reduced motion | suppress moving visual, static art remains fixed | Pure model test + scene code |
| Economy/weather RNG and save | renderer never writes WorldState or saves | Code review and JSON snapshot tests |
| 20/50/100, v5/v6 48/96 | at most four handles by scheduler cap | Virtual test + source |

No Phaser runtime or end-to-end scene was launched in this tool environment. A successful Fast CI will only validate automated gates. Full real-PC watchability/perf remains NOT RUN/NOT MEASURED, not assumed PASS.
