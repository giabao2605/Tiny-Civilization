# Tiny Civilization — MASTER PLAN (single source of truth)

**Version:** 1.0 · **Date:** 2026-10-14 · **Status:** Approved as a starting design hypothesis, not yet playtested.
**Document hierarchy:** This file owns scope, priorities, phase gates and non-goals. `SIMULATION_CONTRACT.md` owns state/time/invariants. Each `phases/PHASE_XX.md` owns implementation tasks, deliverables and acceptance tests. `PROGRESS.md` tracks factual execution status.

## 0. Tóm tắt định hướng (tiếng Việt)

- **Đây là game quan sát xã hội**, không phải game điều khiển lính. Người chơi theo dõi một làng nhỏ, chọn NPC, xem lý do họ hành động và hậu quả tích lũy thành lịch sử.
- **Làm cho vui và chơi được trước:** phase 01 phải có map + 20 NPC thực sự đi theo mục tiêu; phase 02 phải có chu trình sản xuất → ăn uống → sinh tồn; phase 03 mới nâng 100 dân.
- **Không overengineering:** một làng 48×48, hai tài nguyên food/wood và tiền; không server, không AI trả phí, không vi dịch vụ, không hàng chục mặt hàng.
- **Công nghệ:** React/TypeScript/Vite + Phaser, nhưng luật game chạy độc lập đồ họa và có thể test trong Node.
- **Kiểm chứng:** world có seed, kết quả tái lập được; pause không tăng tick, save/load không làm lệch trạng thái, hàng tồn/tiền không âm, chết không thể tiếp tục làm việc.
- **Chất lượng trước mở rộng:** hoàn thành phase 00–07 mới gọi là MVP. Phase 08 (nhiều làng, chiến tranh) tạm hoãn, chỉ làm nếu chơi thử chứng minh có giá trị.
- **Theo dõi thật:** xem [PROGRESS](PROGRESS.md) để biết đã code/test được gì. Mọi mục trong plan hiện là dự kiến, không phải chức năng đã xây.

## 1. Product definition

**Pitch:** A living pixel-art settlement in the browser. The player acts as an observer, watches individual citizens make decisions, reads why events happened, and optionally intervenes through limited world-level decisions later. Systems should generate understandable stories rather than present scripted scenes pretending to be a simulation.

**Audience:** Curious players who enjoy idle simulation, city dynamics and emergent narratives. A non-game-developer should be able to open the site and understand what is happening in one minute.

**Experience pillars (ordered):**
1. **Actually alive:** Citizens visibly pursue coherent needs, work, eat, rest, communicate and face consequences.
2. **Causality is visible:** An important event explains its causes and consequences. "Famine" must follow measurable shortage, not a random cinematic popup.
3. **Watchability over feature count:** Legible map, selected citizen and event feed are worth more than five unfinished subsystems.
4. **Persistence and reproducibility:** World seed + deterministic engine; save/load must not alter the timeline.
5. **Lean build:** Add a subsystem only when it enriches the core watching loop, not just for technical prestige.

### First minute / first ten minutes / one hour

- **First minute:** User sees a thriving small village, can pause, run, change speed, click a person and read what they are doing and why.
- **First ten minutes:** People produce food, consume goods, work or struggle, and the village statistics react; at least one meaningful event has a clear cause.
- **One hour:** Some ties, rivalries or policies leave observable consequences. A world can be saved, restored, and compared to the same seed without losing consistency. Speed controls make long-term change tolerable.

## 2. Locked v1 scope and boundaries

| Dimension | Decision | Reason / limit |
| --- | --- | --- |
| Platform | Browser, single-player, desktop-first; responsive viewing on mobile is a polish goal | Fast iteration and testing |
| World | 48×48 square grid, one village, grass/forest/water/road, small landmarks | Enough for readable life; avoid large map streaming |
| Population | Start at 20 NPCs; phase 03 target 100 active; v1 soft cap 100, hard cap 120 | Performance and balance before scale |
| Rendering | 2D top-down pixel aesthetic using Phaser; UI panels in React | Canvas for world; accessible DOM for controls |
| Time | 1 simulation tick = 1 in-game hour, 24 ticks/day; 1× = 2 ticks/real-second; 5× and 20× also planned | History observable at useful speed; no dependence on rendering FPS |
| Movement | Four-way grid pathfinding; no collision physics; interpolate render between discrete logical snapshots | Simple, testable movement |
| Rules | Deterministic seeded pseudo-random numbers, explicit action priorities | Regression tests and reproducibility |
| Persistence | Versioned JSON save in browser, export/import backup | No server required |
| Art | Original minimal pixel assets, procedurally drawn tiles or clearly licensed assets with attribution | Avoid asset/legal bottleneck |
| Language | Vietnamese UI first; English identifiers / docs where helpful; centralize UI text | Fit audience; avoid early i18n framework |
| Deployment | Static build, GitHub Pages or equivalent after passing gates | Free hosting possible |
| Backend/AI | None in v1 | No authentication, paid APIs, database or server operations |
| Input | Observe and inspect; pause/speed/selection. Optional small interventions in phase 05 | Avoid building RTS controls |

**MVP v1 means completed phases 00–07.** Phase 08 is explicitly **post-MVP / optional**. No user-facing release claim until smoke tests and quality gate pass.

### Out of scope for MVP (hard stop)

- Multiple nations, battlefield units, strategic war AI, genetic inheritance, religion, technological eras, complex law courts.
- Multiplayer, cloud account/sync, real-money economy, microservices, server/database, worker fleet, LLM-driven NPC thought, arbitrary plugin architecture.
- Procedural infinite maps, full physics, multi-floor interiors, custom map editor, realistic 3D, dozens of individual goods.
- Sophisticated agent framework, ECS conversion, pathfinding service, premature optimization, elaborate analytics.

These may be reconsidered **only after the MVP is demonstrably fun**.

## 3. Player loop and game systems

**Loop A — Observe:** World evolves → inspect an event → select related citizens/buildings → see needs, inventory, relationships and cause.

**Loop B — Follow a life:** Pick NPC → read current goal, destination and recent actions → watch a need affect choices → see outcome. NPC must never show mutually contradictory state.

**Loop C — Understand the town:** Track population, food days remaining, production, wealth, housing and happiness → detect a growing risk → watch collective response.

**Loop D — Limited intervention (late MVP):** Trigger a small bounded public policy (e.g. food reserve rationing) with cost/consequence. Never add full direct god-mode editing in MVP.

### High-level causal chain

Terrain / accessible resources → citizen needs → job choice / path / action → inventory & town stocks → exchange / wealth → relationships → social events → collective policy → new constraints. Every arrow should have at least one test and a visible feedback path before adding its downstream subsystem.

## 4. Technical blueprint (boring on purpose)

- **Vite + TypeScript + React:** app shell, HUD, inspectors, event feed, settings.
- **Phaser (version pinned during phase 00):** terrain tiles, sprites, camera, selection and animation. Phaser never owns canonical simulation state.
- **Pure TypeScript simulation module:** independent world state and an exported `step(state, command?)`/engine interface. It must run headlessly in tests, with no DOM, canvas, Date.now or Math.random.
- **Vitest:** deterministic and invariant-based unit/integration tests. **Playwright:** basic browser launch, selecting citizens, speed/pause, save/load and screenshot testing when valuable.
- **CSS (small custom design system):** no heavyweight component library required until proven needed.
- **npm with committed lockfile; Node LTS pinned** in setup docs and CI, no undocumented global tooling.

Suggested eventual code layout (create only as implementation needs):

    src/
      app/            # React entry and views
      game/           # Phaser scene, sprite/tile renderer, input bridge
      sim/            # pure rules, action resolution, world state
      data/           # balancing constants, name lists, definitions
      persistence/    # save schema/validation
      styles/         # UI CSS
    tests/
      e2e/            # Playwright
    public/
      assets/         # licensed/original assets, attribution
    docs/
      MASTER_PLAN.md
      SIMULATION_CONTRACT.md
      PROGRESS.md
      phases/PHASE_XX.md

**Boundary rules:**
- Simulation time advances only via explicit engine ticks. Rendering frame count, device clock, React re-render and event listeners must never change world outcomes.
- Phaser reads snapshots/diffs and publishes validated UI input commands. React reads snapshots; neither mutates canonical state.
- One PRNG is controlled by world state. Stable iteration order by explicit ID; no nondeterministic map/object enumeration assumptions in resolution logic.
- Resolve effects atomically per tick, never sell/spend more items than held; capture notable events after effects commit.
- Avoid generic event buses, database layers, dependency injection frameworks and Redux before they solve an observed pain.
- Choose one authoritative state model; no duplicated inventories in "UI model", "Phaser model" and "simulation model".

## 5. Delivery roadmap and phase exit gates

| Phase | Goal | Milestone / exit gate | Dependency | Indicative effort* |
| --- | --- | --- | --- | --- |
| [00](phases/PHASE_00_FOUNDATION.md) | Project skeleton and engineering guardrails | App builds, tests run, Phaser canvas & React mount/unmount cleanly | none | 1–2 days |
| [01](phases/PHASE_01_LIVING_WORLD.md) | First observable world | 48×48 map, 20 visible NPCs following simple goals, pause/1×/5×/20×, inspectors | 00 | 3–5 days |
| [02](phases/PHASE_02_SURVIVAL.md) | Survival loop | Hunger/energy, food/wood, jobs, finite stocks and measurable consequences | 01 | 4–7 days |
| [03](phases/PHASE_03_ECONOMY.md) | Sustainable 100-person town | Housing, controlled production/trade/money, 100 NPC benchmark and town metrics | 02 | 5–8 days |
| [04](phases/PHASE_04_SOCIAL.md) | Emergent stories | Durable relationships, conflicts, household ties and grounded event explanations | 03 | 4–7 days |
| [05](phases/PHASE_05_GOVERNANCE.md) | Village-level history | Small governance system plus finite, testable crises and meaningful policy response | 04 | 4–7 days |
| [06](phases/PHASE_06_QUALITY.md) | Save/load, legibility, robust simulation | Deterministic restoration, usability pass, stability/perf/balance targets | 05 | 4–7 days |
| [07](phases/PHASE_07_RELEASE.md) | Playable public MVP | Automated gates green, deployed static site, known limitations documented | 06 | 2–4 days |
| [08](phases/PHASE_08_EXPANSION.md) | Optional future kingdoms & war | Separate go/no-go review; only implement after real MVP feedback | 07 | Not estimated |

*Effort is a rough planning range with AI assistance, **not a deadline or commitment**. A phase can take longer after testing reveals actual complexity. Deliver quality in small vertical slices instead of trying to write all features at once.

### Per-phase implementation protocol (mandatory)

1. Read this master plan, the simulation contract, the current phase and `PROGRESS.md`.
2. Inspect current repository and latest commit. Record assumptions and actual available functionality.
3. Split the phase into independently testable, user-visible slices. Do the smallest end-to-end slice first.
4. Implement with minimal dependencies, write focused tests for rules/invariants, then run the application and browser smoke test.
5. Verify the **negative cases** (unreachable route, empty stock, save corruption, NPC death mid-action, fast-forward) relevant to that phase.
6. Recheck architectural boundaries, performance and player clarity; do not claim a feature complete because TypeScript compiles.
7. Update progress with changed paths, tests run, actual result, screenshots/evidence if available, open bugs and next action.
8. Mark a phase DONE only when *all* acceptance criteria pass and there are no high-severity known blockers. Else mark PARTIAL/BLOCKED and explain.
9. Commit scoped changes, preferably on a feature branch/PR; never overwrite unrelated user changes.

**Do not skip phases blindly.** An urgent bug fix can modify an earlier subsystem while the current phase is underway, but document why.

## 6. Quality gates: what "done" really means

### Continuous checks
- TypeScript strict mode and lint clean; production build succeeds.
- Unit tests assert deterministic seeded runs, finite resources, no negative money/inventory, logical occupancy, action validity, NPC life-state integrity.
- Browser smoke covers load, visible map, pause/no tick movement, selected-NPC inspector, speed control, save/load once implemented.
- Browser console has no uncaught errors in core flows; assets do not silently 404.
- No secret keys, tokens, service account credentials or private user data in repo.

### Phase 06/07 release targets (test, not promise)
- 100 NPCs, 48×48 tiles: **20× simulation speed** remains responsive on a named reference machine/browser, with no sustained UI lock-up. Measure p95 engine tick time and frame time before setting a hard numeric budget; provisional engine p95 target **below 25 ms/tick** at 100 NPCs.
- Deterministic reference scenarios replay identically from the same seed and input commands after save/restore.
- At least **30 in-game days** of autonomous running without invalid state, crash, runaway negative stock or permanent all-NPC deadlock. Long-duration tests run headlessly; compare multiple seeds.
- 0 critical/high severity bugs open, no TypeScript/lint/build/test failures, and no save-loss in ordinary cases. Browser-storage limits/corruption are handled gracefully with export/import option.
- User can explain what at least 3 notable events mean by viewing the HUD/inspector, without reading source code.
- A novice user can start a world, change speed, inspect a citizen and recover a save with minimal instructions.

**Performance numbers are provisional until measured** and must not be "passed" by lowering NPC count without reporting it.

## 7. Risks and guardrails

| Risk | Early signal | Mitigation / fallback |
| --- | --- | --- |
| NPCs wander without purpose | Walking but no work/consumption outcomes | Goal explanation in inspector; direct action tests; shorten path/work schedule |
| Economic collapse every seed | Food/wealth trends crash consistently | First establish survival equilibrium in phase 02; tune config from seeded tests; avoid magical replenishment |
| All worlds behave identically | Same events every seed | Vary jobs, traits, starting stocks and geography; compare seed distributions |
| Non-determinism | Save/load or repeat test diverges | State-controlled RNG; stable iteration; commands captured at tick boundaries |
| Too many features / overengineering | New abstractions without an observable win | One-system-at-a-time policy; ban listed out-of-scope features |
| Map graphics slow/ugly | FPS drops, citizens hard to see | Basic sprites/tiles first, selectively pool/reuse, only polish after real profiling |
| Browser save corrupted or big | Import failure, quota exceeded | Version & shape validation, error UI, manual JSON export/import, recovery instructions |
| Timeline too slow to show society | Hour-long play yields no visible payoff | Distinct social event cadence, 5×/20×, optional bounded fast-forward once tested |
| Copyright on sprite packs | Unknown license | Procedural/original art or attributed, compatible assets only |

## 8. Review and change-control policy

**Allowed easy adjustments:** CSS, readable names, numerical balancing through centralized constants, test coverage, bug fixes.

**Needs documented decision in this file:** Altering tick/calendar model, engine/render library, asset licensing approach, population cap, adding a backend/AI API/multiplayer, splitting into multiple settlements before phase 08. State the motivation, alternatives considered, migration impact and acceptance tests.

**No silent feature deletion:** If a task is impossible or unjustified, label deferred/removed with reason and update the phase's criteria.

### Questions to validate in actual playtesting (not blockers to planning)

1. Is the preferred world look top-down pixel tiles vs slight isometric? **Default:** top-down.
2. Is passive observation enough, or do users want a small "intervention" lever? **Default:** one limited public-policy control at phase 05, not god mode.
3. Is 20× enough to tell years-long history? **Default:** benchmark first, add batch fast-forward if needed.
4. Do we need actual portraits? **Default:** colored/simple original sprites and clear named profiles before expensive art.

## 9. References / technology notes

- Official Phaser docs: https://docs.phaser.io/ (WebGL/Canvas browser rendering, TypeScript, React integration).
- Official Vitest docs: https://vitest.dev/ ; Playwright: https://playwright.dev/
- These links inform tool selection, not a claim that dependencies are already installed. Pin exact compatible versions during phase 00.

## 10. Next action

**Only planning documents exist after this planning commit.** Next code task: execute `PHASE_00_FOUNDATION.md`; verify its exit gate; update `PROGRESS.md`. Do not mark any implementation phase complete in advance.
