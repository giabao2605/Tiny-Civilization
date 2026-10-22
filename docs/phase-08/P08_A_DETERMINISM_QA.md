# P08-A determinism QA plan

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

Existing contract: one tick per game hour; pause zero ticks; same initial state and ordered commands yields same state; preserve PRNG and IDs. Existing frozen fixture `tests/fixtures/t06c-engine-checkpoints.expected.json` must remain untouched. No Phase-08 branch benchmark or test suite has been run at document-authoring time; inherited main CI verifies only baseline.

Future gates: 20/50/100 NPC × 48/96 worlds, identical replay + split save/load, all three incoming save formats, malformed/oversized/unknown versions, bad RNG, dangling settlement/shipment IDs, repeated commands, matching delivery ticks, stalled routes, atomic failed import. Check engine+weather RNG streams and 12 prior SHA checkpoints unchanged. Physical PC render/soak NOT RUN and FPS NOT MEASURED.
