# N03-D — Readable routines, POI and social observation

**Task:** N03-D only. **Base:** N03-C PR #25 merge `f6e9a54b`. **Branch:** `feat/n03-d-readable-routines`. **Status:** implemented candidate; final-head CI/PR evidence required before VERIFIED.

## Behavior decision

Keep the authoritative `advanceOneTick` goal hierarchy. Add only a short **evening POI visit** when the previous scheduled goal would have been `commons`, and *only after* urgent health, eating, rest, sell/stock, construction and guardian obligations have had priority. No new random walk, dialogue, LLM or independent schedule/FSM.

- **Scope:** only new v6 **96×96 worlds** with existing `layout.pois`. v5 48×48 and migrated v6 48×48 keep their old goals and frozen N03-A traces.
- **Eligible POIs:** existing `role: 'event'` POIs (well, bench, courtyard, notice-board, flag, viewpoint, birdwatch) plus a small explicit set of **quiet scenic stops** (`garden`, `fountain`, `shade-tree`, `flowerbed`, `wildflowers`, `fallen-log`), whose metadata remains `role: 'decorative'`. Decorative stops are **rest/observation only**, never economic sites or automatic social encounter locations. No map metadata, POI IDs, authored layout generation or save schema are modified.
- **Starting conditions:** at 18:00 only, alternating calendar days by citizen ID (one possible start every **48 game-hours**), adult and alive, `needMode === null`, health ≥65, hunger ≥72, energy ≥50, and food owned **or** money plus market food available. Starting from an economy/food/rest commitment is impossible because leisure selection occurs *only* on `requested === 'commons'`.
- **Destination:** approved event or quiet scenic POI, current walkable tile, Manhattan distance ≤8; stable nearest-distance and POI ID order; real `findPath` reachability and path length ≤8 steps. No random PRNG consumption. Actual movement remains `resolvePath` (N03-C guarded time-first routing) at **4 tiles/hour**.
- **Duration:** 18:00, 19:00 and 20:00 hourly decisions at most. Previous `recent` activity marks continuation; after 20:00, switch to existing home schedule. A serious need or obligation always interrupts immediately; there is no automatic restart at 19:00. If path becomes blocked, the existing routeBlocked/home fallback handles it.
- **Arrival:** only when the real simulation reaches the POI; `leisureIdle`, `actionDuration = 1` and standard commons-scale `energySocialRecovery`. Travel still spends `energyTravelPerHour`. Only `reason`, activity, and recent log present the visit.
- **No save version bump:** adds two enum values `travelToLeisure` / `leisureIdle` and goal `leisure` to existing v6/v5 validator; no extra stored fields. Old saves remain readable; schema v6 remains intact.

## Causal social logic

The existing `applyInteraction(..., 'chat')` guard still requires **two living adult people on exactly the same tile**, both stationary this hour, within cooldown and social interaction budget. Chats may now take place when both people have the **authoritative leisure goal** at a genuine `role: event` POI; scenic decorative stops explicitly do **not** allow new chat triggers; the cause explicitly names that POI. Sprite proximity alone, a decorative POI, a moving visitor or a single person never creates affinity. Work, scarcity, housing and partnership mechanics unchanged.

## Observer UI

Inspector reuses `activity`, `goal`, `destination`, `reason`, `recent`, route length and Follow NPC. At a leisure POI, it displays a human label for the actual selected POI and notes the bounded departure condition. No HUD redesign. Dev-only `?fixture=n03d-leisure-poi` positions two eligible adults at a real event POI at tick 17; **all tick decisions and contact checks remain inside the real engine**.

## Engineering boundaries

No worker, dependency, backend, weather, path recovery redesign or renderer-side authority. `src/sim/routing.ts` and `BALANCE.moveTilesPerHour = 4` unchanged. Legacy golden fixture hashes unmodified. Plan 04 and N03-E/F untouched.
