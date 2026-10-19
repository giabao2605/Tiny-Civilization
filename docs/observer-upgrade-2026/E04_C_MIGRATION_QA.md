# E04-C Migration & QA Matrix

| Historical input | Envelope | World before | Runtime after `parseSave` | Rule |
| --- | --- | --- | --- | --- |
| Historical immutable v5 48×48 | 1 / sim-v5-phase06 | v5, no weather | v6 48×48 + seeded weather at existing tick | preserve every v5 projected field and pending command |
| Historical v6 48×48 migrated | 2 / sim-v6-map | v6, no weather | v6 48×48 + seeded weather at existing tick | no tile or RNG replay |
| Historical v6 96×96 | 2 / sim-v6-map | v6, no weather | v6 96×96 + seeded weather at existing tick | preserve layout/road metadata |
| New v6 48×48 or 96×96 | 3 / sim-v6-weather | v6, full weather | identical v6 weather | reject missing/bad enum/intensity/tick/RNG |
| Legacy-only tooling `parseLegacySave` | 1 | v5, no weather | byte-identical v5 | immutable golden SHA-256 remains valid |
| Unknown version pair | other | any | rejected | no mutation |

**Regression strategy:** Keep original fixture bytes and manifests unchanged; compare `canonicalV5Projection` for continued old v5 worlds against new migrated 48×48 worlds. Test new v6 save roundtrip, old v6 hydration, no weather RNG consumption between transitions, bounded dwell, seeded 720-tick 96×96 continuations, bad import atomicity and existing scheduler/replay suites. UI selection/runtime timer should not be mutated on parse errors.

**Unverified:** local PC visual QA, optional browser, real performance/CPU/FPS `NOT MEASURED`. No fake numbers. E04-D must validate weather-driven art at 06/12/18/23 and all four kinds independently of this state-only implementation.
