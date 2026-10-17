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

## Status
Independent local Node 22 minimal-harness Dijkstra comparison PASS on 500/500 varied maps; this is not full repository verification. Final QA comes only from completed GitHub Actions. Windows GPU/FPS and 60–120-minute physical soak: PARTIAL / NOT RUN.
