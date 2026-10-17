# N03-B — Algorithm QA

## Cases
- Same start/end, out of bounds, malformed map size, water start/end, unreachable isolated target.
- Geometrically short expensive grass against a longer cheaper road; equal-cost ties and 41 repeated deterministic runs.
- Main/plaza/side/footpath costs, ignored road overlays on grass/water; fallback for corrupt subtype; strictly positive finite traversable cost.
- Independent Dijkstra reference defined **only in test**, 50 weighted/blocked 8×7 grids × 12 origin/destination pairs (600 comparisons): reachable agreement and exact optimal cost. Routes may differ when multiple minima exist.
- Real 48×48 legacy seed613/pop50, real 96×96 seed12345/pop100, actual site/resource destinations and all authored entrances, no diagonal/water/out-of-bounds. Mutation check compares full world JSON before/after, including RNG.
- Production BFS diagnostics unchanged by new calls; immutable N03-A golden fixtures and existing W02-F BFS route identity remain untouched.

## Regression gate
Existing N03-A four golden 48-tick traces, two RouteBlocked cases, frozen v5 SHA-256, v5→v6 migration, save/load, replay, economy/survival/social/governance, Chromium E2E and production smoke must all pass final-head CI. Never rewrite expected fixtures to force success.

## Confirmed CI and remaining gate

- Independent temporary Node 22 comparison: 500/500 varied maps matched Dijkstra (separate harness; not a substitute for repository tests).
- Repository Vitest: **28 files / 239 tests PASS**, including the in-repo 50-grid × 12-pair Dijkstra oracle, four immutable N03-A traces, blocked-route regressions, legacy save/migration and gameplay tests.
- Chromium Playwright: **40 E2E PASS**, production build smoke **1 PASS**. `npm ci`, npm production audit, typecheck, lint, unit tests, normal and Pages-mode build, artifact upload all PASS.
- Evidence: [CI #39015721866](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39015721866) on implementation commit `2d939d02ddd029b26eccb58a87515f7ef46ac16c` (conclusion: success).
- This is implementation-HEAD evidence. A documentation-only follow-up commit must pass its own **final-HEAD CI** before complete PR acceptance.
- Physical Windows GPU/FPS, local long soak 60–120 minutes and target-PC manual validation: **PARTIAL / NOT RUN**, not covered by Linux hosted browser CI.
- The cost/route algorithm remains isolated, with unmodified production BFS and unchanged N03-A fixtures.
