# A05-D — Lifecycle & Isolation QA

| Scenario | Expected invariant | Evidence / status |
| --- | --- | --- |
| App mounts while audio off | zero AudioContext creations, no sound | Mock test; CI NOT RUN |
| First real unlock | exactly one context, two ambient loop sources | Fake AudioContext; CI NOT RUN |
| Duplicate transition / React rerender | same started ID is consumed once, never queued | bounded seen-ID test; CI NOT RUN |
| End/cancel with ID only | releases exact SFX voice, no stale descriptor lookup | controller test; CI NOT RUN |
| Bell-hour without graphics | audio event reaches controller independent of sprite registry | fake civic bell test; CI NOT RUN |
| Pause / hidden / mute / no volume | audible SFX stop, ambient gains target zero; no backlog | model/unit + static policy PARTIAL |
| Zoom, pan, follow and AFK | spatial gain/pan recalculated in world pixels ≤10Hz | pure tests; live browser NOT RUN |
| World replacement / save import / scene shutdown | controller clears scene voices and consumed IDs, persists single shared context | bridge/reset code; manual NOT RUN |
| React unmount | two ambient sources stop, all nodes disconnect, one context closes | fake context test; CI NOT RUN |
| Unsupported/rejected audio browser | game remains usable; one retryable context | fake rejection test; CI NOT RUN |
| WorldState/save/gameplay RNG | no mutation or serialized audio fields, director scheduling unchanged | code review PASS; replay regression CI NOT RUN |

**Resource policy:** 2 ambient buffer sources per unlocked context; max 4 simultaneous one-shot voice envelopes; no infinite event loops; seen-ID ring bounded at 192. A completed oscillator invokes cleanup; scene shutdown always releases remaining voices. Counters are diagnostics, not proof of leak-free real-device use.

**Outstanding:** Real browser/physical audio confirmation, world-restart races under React StrictMode, extended tab suspension and long-run resource sampling must be performed on PC. Avoid claiming complete audio acceptance until these are done.
