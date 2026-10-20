# A05-E — Watchability Tuning & Performance (2026-10-20)

**Baseline verified:** A05-D PR #38 merged, main `c57861434acc91f9046b8b8e6821694cf9aaf7d7`; post-merge Fast CI [#39381545911](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39381545911) SUCCESS on exact SHA. No later merged PR was present at preflight. Branch `feat/a05-e-watchability`, draft PR #39.

## Implemented (presentation only)
- `AmbientDirector` keeps its single virtual presentation clock, 8-second selection interval, one start/interval and four active maximum. A **two-start fairness penalty for offscreen visual candidates** prioritizes near-camera activity without permanently excluding other districts; audio-only candidates retain original category scoring. All candidates still require real anchors, road preflight, weather/hour eligibility and cooldown.
- Five-minute acceptance fixture now begins at canonical hour 07:00, when market, wildlife and domestic visual candidates can actually coexist. It does not fabricate transactions, social citizens or a second gameplay clock. The visual-registry test now asserts **three distinct categories**, not merely two.
- `AmbientVisuals` tracks bounded `renderedTypes` and `renderedCategories` sets, incremented **only after a Phaser handle is created inside camera bounds**; existing object creation/destruction counters remain. These are read-only `?observerPerf=1` metrics and are explicitly **not** proof of human visual readability or of a GPU-drawn pixel.
- Small overview-only scale boost up to 1.35× makes birds/pets/cart silhouettes less tiny on wide map overview. Native scale is preserved at normal/close zoom; no sprite assets are introduced.
- `AmbientVisualRegistry` avoids constructing a new intermediate `Map` plus mapped tuples each frame. Since the director caps active actors at four, checking visibility against a short filtered list remains bounded. This is an allocation-reduction change, **not a measured FPS improvement**.
- Optional **real-wall-clock** Chromium test in `tests/e2e/a05e-watchability.spec.ts` samples handle categories and object counts at 30, 60, 120, 180, 240 and 300 seconds, captures two canvas screenshots and checks runtime console errors. It is not part of Fast CI or a substitute for human screenshot review.

## Unchanged contracts
- No changes to `src/sim`, `WorldState`, gameplay RNG, weather RNG, economic transactions, NPC goals, save format or gameplay timing.
- No second ambient/audio scheduler; no new fake citizen IDs, music files, remote assets, multiplayer, mobile optimization, cloud backend or Pages deploy.
- Camera follow/AFK behavior, shared Web Audio ownership, audio unlock and lifecycle semantics remain as in A05-D.
- Rollback: revert the A05-E commit(s); `main` and saved worlds require no migration.

## Limits
A real browser screenshot inspection (including whether a viewer actually notices each category), physical speaker/headphone listening, matched before/after FPS and 60–120-minute soak **cannot be certified from source, fixtures or Fast CI alone**. Those gates remain open in the QA documents.