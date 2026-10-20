# A05-B — Determinism QA
Same seed, snapshot sequence and virtual delta sequence -> identical `AmbientTransition` and counters. Stable sorting by played-category count, priority, type and anchor key. All gameplay decisions remain in `advanceOneTick`; ambient never calls gameplay RNG or alters `WorldState`. Tests compare 48 hourly engine ticks with/without ambient for exact world equality and weather RNG equality. No `Math.random`, `Date.now`, physics collision, network, persisted timers or extra clock. Canonical hour/day and current weather gate candidates through existing A05-A catalog.

Virtual `300000ms` fixture measures *scheduler readiness*, not real-world render watchability. Paused, tab-hidden and frame discontinuity do not accumulate missed ambient events. No precise FPS/heap can be inferred from unit tests.

Fast CI run on final PR HEAD is required before marking automated results PASS. Full manual Playwright and Windows PC testing remain NOT RUN.
