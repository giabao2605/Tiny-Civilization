# E04-E to E04-F Handoff (conditional)

Predecessor: E04-D PR #32 merged to main at d099c8650fd4b1ef6d5029613cb71ab6ab38407a; verified post-merge Fast CI success. Detailed E04-D manual QA screenshot evidence was not supplied; owner explicitly approved merge after local PC inspection.

Do not open E04-F until:
- E04-E final-head Fast CI is SUCCESS, head SHA matches PR head.
- Regression, deterministic replay, old-save migration, money conservation and routing gates are green.
- A person runs the mandated weather audio unlock/lifecycle and NPC shelter inspection in local Chromium; results and evidence recorded.
- 48×48 shelter behavior coverage is reconciled with the frozen v5 projection contract (currently purposely legacy-preserving and **not feature parity**).
- PR is mergeable, reviewed, merged with merge commit, post-merge main Fast CI success on merge SHA.

E04-F, once unblocked, is solely integration and 60–120min performance soak: 48/96 maps, 20/50/100 NPC, three PC viewports, legacy/Observer clock modes, old saves, four weather types and memory/FPS/routing profiling. Never claim 60 FPS or deploy without measurement.
