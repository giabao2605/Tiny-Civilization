# A05-E → Q07-A / T06-F handoff

## Delivery
Branch: `feat/a05-e-watchability`; [draft PR #39](https://github.com/giabao2605/Tiny-Civilization/pull/39) against `main`, not merged. Base `c57861434acc91f9046b8b8e6821694cf9aaf7d7`, PR #38 post-merge CI [#39381545911](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39381545911) SUCCESS.

Implemented: camera-visible category cost in existing ambient scheduler; seeded three-category fixture/test; small overview silhouette scale; bounded Phaser-handle category diagnostics; reduced visual-registry temporary collections; manual five-minute Chromium screenshot/metric test. No gameplay, save schema or economic/RNG changes. No deploy.

## Open QA gates
1. Run and **inspect** the real 30s/5m browser screenshots; human observer must distinguish 3 separate event categories. The counter alone is not acceptance.
2. Perform 20–30 minute watchability session across 2 natural seeds, record timestamped types, districts and camera comfort.
3. Test audio on actual headphones/speakers: bell/cart/birds/ambience, spatial L/R, wet/night/clear transitions, tab hide/unhide and reset/unmount. A05-D audio acceptance remains NOT RUN.
4. Run full 48/96×20/50/100 × viewport/weather representative browser matrix and a matched prior-vs-A05-E FPS/heap sample.
5. Run 60- and (if feasible) 120-minute PC soak and inspect long-run resource growth. Do not infer memory leak freedom from a short snapshot.
6. Confirm Fast CI on **exact final HEAD**, including any docs-only commits, before readiness/merge decision.

## Suggested next task
**Plan 07 / Q07-A — QA Test Plan & Fixtures**, coordinating cross-cutting Plan 06 / T06-F reliability soak. Do not start new festivals, NPC economy mechanics or renderer rewrites as part of this task.

### Copyable execution prompt
> TASK Tiny Civilization — Q07-A QA Test Plan & Fixtures (Observer Upgrade 2026). Repo https://github.com/giabao2605/Tiny-Civilization, base the newest verified main only after A05-E PR #39 has been reviewed and explicitly merged by the owner. Read README, Simulation Contract, docs/PROGRESS, observer Master Plan, plans 05/06/07 and A05_E_* QA/handoff plus current code and browser harness. Audit QA-01..12, build a seed/population/map/viewport/weather/speed/reduced-motion/audio test matrix, distinguish test-only handles from visibly legible real graphics, and document reproducible 30s/5min/20–30min studies. Provide real browser captures and audio listening where available; log NOT RUN/NOT MEASURED otherwise. Add tests/fixtures only as needed without altering WorldState/RNG/save, run Fast CI on final head, create PR, do not merge or deploy. Coordinate 60/120-minute local Windows soak under T06-F with exact device/heap/FPS evidence and retain outstanding acceptance gates.

## Reviewer decision
Do not mark A05-E fully VERIFIED until human screenshot watchability and physical-audio/performance gates are satisfied, or the owner explicitly accepts their remaining PARTIAL/NOT RUN status.