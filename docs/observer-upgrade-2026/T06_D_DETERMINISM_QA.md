# T06-D determinism and persistence QA

This task has not changed sim/RNG/save code. **NOT RUN on T06-D exact HEAD**: npm ci, audit, typecheck, lint, Vitest, build, Playwright. T06-C's post-merge CI SUCCESS belongs to the baseline only, not this branch.

Required: twelve frozen SHA-256 checkpoints, original v5 golden fixture, save format 1/2/3, 8 MiB limit, pending governance commands and nextRequestId, corrupt import atomicity, 48x48 save continuation, 96x96 reload, diagnostics parity, 100 NPC 20x stress, pause/resume and hidden-tab behavior. Never rewrite expected hashes to fit a changed engine.
