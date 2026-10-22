# Q07-D — QA-08 watchability matrix

| Gate | Fixture and source | Oracle | Result |
|---|---|---|---|
| 30-second virtual logic | sign-of-life-30s; seed 107; 20 NPC; 96×96 | scheduled actor and bounded lifecycle | Existing Vitest coverage; no real visibility claim |
| 30-second actual | natural PC localhost | visually clear sign of life, video timestamp | NOT RUN |
| 5-minute virtual logic | three-categories-5min; seed 107; tick 7; 300000 virtual ms | ≥3 **scheduled** distinct categories | Existing and Q07-D Vitest assertions; real criteria still open |
| 5-minute actual | same seed/setup documented with video | ≥3 **observed** distinct on-screen categories | NOT RUN |
| 20–30-minute observer | seed 107 or documented observer setup | causal sequence, idle gaps, repeat and camera audit | NOT RUN |
| Natural 1 | Q07-normal-life, seed 101, 20 NPC, 96×96 | natural action/ambient progression | NOT RUN |
| Natural 2 | Q07-weather-transition, seed 127, 20 NPC, 96×96 | weather/NPC causal progression | NOT RUN |
| Camera/AFK | AFK director, source/tests | real targets, relinquish manual control | SOURCE REVIEWED; real interaction NOT RUN |
| Hardware | named PC and browser | FPS/heap/GPU | NOT MEASURED (Q07-E) |

No real-time watchability PASS is claimed from a scheduled candidate, a simulated game tick, or a virtual presentation clock.
