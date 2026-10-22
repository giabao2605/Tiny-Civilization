# P08-A Multi-settlement architecture options

Baseline `main@52a06752c949fe9f1956d304fcd9aec433c6bddb`; post-merge CI [#39717445823](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39717445823) `completed/success`, exact SHA. Review 2026-10-22. Phase 08A preproduction, not production feature acceptance.

## Option comparison

| Criterion | Two connected detailed villages | Lightweight world overview |
|---|---|---|
| Rendering | Potentially two maps and NPC sets | Only selected settlement rendered |
| Simulation cost | High if both full-frequency | Secondary settlement may use bounded aggregation |
| Identity and economy | Shared IDs/ledger required | Shared IDs/ledger still required |
| Migration | Container/schema change | Container/schema change |
| UI | Connection and cross-map navigation | Selection + summary + shipments |
| Extensibility | Direct spatial interaction | Lower-cost trade/diplomacy |

**Recommendation (design only):** lightweight overview with one detailed settlement and deterministic bounded remote model; verify product and perf evidence first. Preserve current `WorldState` as authoritative single-village runtime, without shadow inventory. Future `CivilizationState` may own stable string settlement IDs, active settlement ID, indexed local ownership, global tick and shipment ledger. Explicit local ownership applies to market cash/stocks, citizens and resource nodes; do not derive second stocks by cloning existing inventory. A shared currency unit can exist with settlement-specific account holders, no phantom global treasury. Shipment escrow is its sole in-transit ownership. World history references authoritative committed transactions and persistent stable event IDs.

No engine duplication, Phaser dependency or new `WorldState` fields in this PR. Stable ordering by shipment/settlement ID; invalid destination resolution and remote scheduling are unresolved design questions requiring tests before implementation.
