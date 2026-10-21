# T06-D — Before / after evidence and acceptance

The owner changed scope on 2026-10-21: only playable locally on PC, no mandatory Chromium benchmarks or automated FPS gate. The dedicated T06-D browser benchmarking workflow and its tests have been removed; Fast CI and pure Vitest remain.

For traceability, the last optional paired Chromium run completed **SUCCESS** at [#39531644418](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39531644418). Identical test code was used with baseline main `00e87069` and proposed culling implementation, sequentially on the same Ubuntu runner with Chromium 141.0.7390.37.

| Metric (96×96 / 100 NPC / seed 12345, aggregate 36 samples each) | Baseline | Candidate |
| --- | ---: | ---: |
| Median rAF-estimated FPS | 4.26 | 4.26 |
| Median per-sample frame-p95 (ms) | 250 | 250 |

This run **does not demonstrate a measurable aggregate FPS gain**. Headless CI was heavily CPU-bound; it is not equivalent to GPU frame time or a user desktop PC, so no performance improvement claim or 60 FPS claim is justified. Static culling reduces displayed offscreen tree instances in close-up views by design; quantitative local PC benefit is unknown.

The T06-A Node benchmark applies equally to both versions because the authoritative simulation code is unchanged; do not mistake it for a renderer before/after.

Any future manual PC comparison is optional, not a T06-D merge gate. Remaining risks: camera-changed visibility scan overhead, external machine/browser differences and lack of long soak.
