# T06-F implementation
Base: main `2d8c8f2b9d040e917f988d9eb964972f0f30b6db`. T06-E PR #45 merged; CI #39539128248 completed/success on the same SHA. Branch `feat/t06-f-long-run-reliability`. Desktop localhost only; no merge or deployment.

## Confirmed lifecycle race
`WeatherAudio.unlock()` awaited `this.context.resume()` then read `this.context.state`. If React unmounted / destroyed the audio owner during the pending resume, `destroy()` nulled this.context. Once the promise settled, this read threw a TypeError into the generic failure handler and counted a spurious permission/unlock failure. This was a real asynchronous ownership race, not evidence of leaked AudioNodes.

Fix: capture the exact AudioContext across the await and verify that the owner is still alive and owns the same context before applying gain updates / returning success. Test uses a deferred resume promise; destroy during the suspension; assert false, one close, zero active loops, no false unlockFailure. No new audio framework or renderer refactor.

No changes to simulation engine, clock semantics, deterministic RNG, WorldState, schema, golden checkpoint hashes, or gameplay.
