# E04-E Behavior ADR: Weather Reactions and Audio Ownership

Status: IMPLEMENTED ON BRANCH; acceptance PENDING CI + LIVE QA.

## Decisions
- Only the E04-C weather state (advanced inside `advanceOneTick`) affects behavior. No extra clocks, AI APIs, random decisions, or render-time gameplay.
- `src/sim/weatherShelter.ts` chooses a deterministic subset of adults with real owned home sites during rain. Percentage grows with rain intensity (12–66%), using citizen ID and seed, not the simulation RNG.
- The shelter request sits below food/trading/construction/urgent rest/active harvest. Participating residents reuse **home** goal, existing route/search, actual home ownership and recovery/backoff. The reason begins with `Trú mưa` and is shown in the inspector. There is no teleport, free food, construction material, new inventory or new state field.
- Existing external ShelterRequest adapter remains supported.
- Rain ends at the canonical weather transition; the normal goal scheduler becomes active again. Reason clears when no rain shelter remains. Deterministic selection per seed/NPC and weather state prevents reroute oscillation on every tick.
- For backward compatibility with the frozen v5 gameplay projection, automatic shelter decisions are currently **restricted to authored 96×96 layouts**. Historical v5 and v6 migrated 48×48 games still have weather visuals/audio but unchanged NPC behavior. This is a documented gap versus Plan 04 full coverage, not a silent PASS.
- The same 1 tick/hour, clock modes, pausing, entity IDs, survival, ownership and save representation remain. No schema/format migration is introduced.

## Audio
- A single React-owned `WeatherAudio` instance lazily constructs one Web Audio context after the user's explicit audio-enable click. It is independent of Phaser scene restarts and of all simulation state.
- Two filtered procedural looping voices (rain and outdoor wind), bounded gain nodes and one short buffer; gain ramps crossfade over 0.75 seconds. Pausing, hiding tab or muting targets zero gain. Cleanup stops sources, disconnects and closes context.
- Volume/mute are transient local UI state and not in persisted `WorldState`. A page reload requires a new gesture. Browser rejection returns an explanatory message without blocking gameplay.
- Sound is generated, not borrowed licensed audio. No umbrella art for this E04-E.

## Alternatives rejected
- New `shelter` goal/activity persisted in JSON: would expand historical validators/fixtures without need.
- Treating decorative trees/POIs as free shelters: no supported shelter contract or occupancy.
- Audio started from React effect or Phaser frames: violates browser gesture policy, multiplies nodes and couples audio to rendering.
- Running BFS for all homes each render frame: excessive; existing router is used only on actual goal changes.
