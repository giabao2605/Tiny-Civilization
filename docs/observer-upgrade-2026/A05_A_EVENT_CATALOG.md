# A05-A — Plan 05 event catalog contract

The runtime catalog is `AMBIENT_CATALOG` and `AMBIENT_TYPES`. Every candidate includes `layer:'cosmetic'`, namespaced string ID, canonical tick-based key, real anchor, virtual presentation start/duration, priority, budget class and documented reason. The following durations/cooldowns are **initial tuning defaults**, not measured live cadence.

| Type | Trigger / allowed weather | Real anchor | Planned audiovisual effect | Duration / cooldown | 48×48 |
|---|---|---|---|---|---|
| market-open | 07h, any | real market/Civic site | canopy and open signs | 12s/60s, static | real market |
| market-close | 19h, any | same | close and lights | 12s/60s, static | real market |
| cart-delivery | daytime, clear/cloudy | 96 main civic road | nonblocking moving cart | 16s/70s, moving | **skip**, no road hierarchy |
| plaza-chat | 18–20h, two living co-located idle actors at commons or event POI | real NPC pair | gesture, **no** new friendship | 7s/45s, static | commons only |
| bird-visit | dawn/day, clear/cloudy | real Nature event birdwatch/viewpoint POI | fly/land/chirp | 11s/38s, moving | **skip** |
| pet-wander | day, clear/cloudy | real home/Residential | pet stroll | 14s/65s, moving | real home |
| chimney-smoke | dawn/dusk, any | real home | short smoke | 13s/46s, static | real home |
| rain-shelter-visual | rain, real home goal, activity and `Trú mưa` reason | real living NPC | umbrella/roof splash | 10s/35s, static | if true reason exists |
| bell-hour | 06/12/18h, any | real commons/Civic site | one-shot SFX in A05-D | 3s/40s, audio | real commons |
| puddle-bird | dawn/day, clear/cloudy within 2 ticks of **observed** rain stop | real nature event POI | bird on wet ground | 9s/70s, moving | **skip** |
| window-light | dusk/night | Plan 04 lighting owner | existing visual ONLY; **not scheduled** | n/a | Plan 04 already handles |

**Universal prohibited actions:** mutation of authoritative WorldState, world.events, money, stock, health, social relations, NPC goal/action, weatherRngState/rngState; creating fake trades/sites/citizens; blocking routes or moving to water. Missing anchor ⇒ no event. 48×48 must not invent districts or fake roads.

**Global limits:** at most 4 active (future tune 3–5), max 1 per anchor (future tune 1–2); cooldown per type/anchor, max 128 cooldown history entries. A05-C must prove valid *route* for cart/pet, not only a valid initial tile.
