# Phase 08 readiness audit and verification plan

**Decision (2026-10-15): NO-GO / BLOCKED for 08A.** This is an audit and preparation record, not acceptance of multi-settlement work. It does not certify a public release or simulate player feedback.

## Reproducible evidence at the Phase 07 merge

- Branch: main at 1d56f01924f160f45dfb6a7319850ee41a311935 (PR #8 merged).
- Post-merge CI: https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676668747 concluded SUCCESS (Node checks, tests and local production-preview smoke).
- Post-merge Pages: https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676669541 concluded FAILURE: verify-build failed at actions/configure-pages@v5; deploy skipped. The earlier Phase 07 feature Pages run #38675616000 had the same configuration block. The public URL was not independently verified.
- Historical Phase 07 branch evidence: https://github.com/giabao2605/Tiny-Civilization/actions/runs/38675621606 PASS with 84/84 Vitest; Chromium dev 12 PASS, one production-only test skipped; preview smoke 1 PASS. Node 100-NPC/1,000-tick p95 reported 4.738 ms/tick. A short 100-NPC/20x Chromium sample reported about 30 average FPS and p95 frame 66.8 ms on a GitHub-hosted runner. These are NOT physical-device results or an 08A headroom estimate.
- Engine save compatibility baseline: JSON save format 1; engine version sim-v5-phase06. The 08A implementation must not mutate this format or its stored states before a migration design and fixtures are approved.

## Gate matrix

| Gate | Evidence | Result / blocking action |
| --- | --- | --- |
| Main CI after Phase 07 merge | Run #38676668747 SUCCESS | PASS |
| Public playable Pages deployment | Run #38676669541 failed configure-pages; deploy skipped | BLOCKED: repository owner enables GitHub Actions as Pages source, reruns deploy, checks public URL |
| Production browser code paths | Historical Chromium preview smoke on build | PASS for preview only; live site NOT VERIFIED |
| Real public save, reload, JSON import/export | Preview-only test evidence | NOT VERIFIED; run post-deploy public Chromium smoke |
| Deterministic save/replay, inventory and money | Phase 06/07 automated unit and stress suites | PASS at single-settlement engine scope; no claim for multi-settlement |
| 100-NPC headroom for additional settlement | CI Node/Chromium samples, only one settlement | UNKNOWN, measure sustained memory/FPS and 20/50/100 profiles on real hardware |
| Independent novice player observation for 30–180 in-game days | No independent sessions submitted | NO-GO |
| Trade adds a meaningful new observation loop | No player evidence/hypothesis test | NO-GO |
| Acceptance of 08A scope/balance cost | Optional expansion has no explicit owner approval | NO-GO |

**Decision rule:** Do not start feat/phase-08a-settlements, do not modify WorldState for 08A, and do not create a false "Phase 08 complete" PR while any prerequisite remains unverified. The readiness changes belong in a separate release-readiness PR.

## First release blocker: enable and verify Pages

1. Repo owner opens https://github.com/giabao2605/Tiny-Civilization/settings/pages.
2. Under **Build and deployment**, set **Source: GitHub Actions** (not Deploy from a branch). This one-time setting is not writable through the current GitHub connector. Do not store a Personal Access Token or weaken the workflow to bypass the permission.
3. After the readiness PR is reviewed and merged, trigger **Tiny Civilization Pages** on main using Actions > workflow > Run workflow, or push a verified change to main.
4. Require successful verify-build, deploy and verify-live jobs on the same intended head. The verify-live job executes a Chromium check against the *actual* page URL emitted by the deployment, not Vite preview, and captures desktop/mobile viewport screenshots. No verified deploy = no live claim.
5. Independently open https://giabao2605.github.io/Tiny-Civilization/ in a fresh Chromium session and hard-refresh. Verify canvas/NPC, 20/100 NPC, 1x/5x/20x/pause, selection, timeline, local save, reload and JSON import/export. Inspect Console and Network for exceptions and 404s. Record timestamp, commit, workflow run, screenshot and result here. Never upload private player saves into a public issue without inspection.

## Independent novice playtest protocol (NOT PERFORMED)

Recruit at least two people who have not designed the game. Do not coach them except for the public onboarding copy. For each person, record date, device/browser, whether starting fresh or from a save, and which build/commit they played.

- First 60 seconds: Can they identify the objective, start/observe, pause, change speed and select a citizen unaided?
- After 10 minutes of real interaction: Can they recount a causal chain from production/food/market/social/leader event and locate the related NPC or stock change?
- Observe at least 30 in-game days for each tested scenario (check tick >= 720); aim for at least one longer 180-day observation (tick >= 4320) if performance and interest permit. Record the actual completed tick, wall time and any interruption; do not fabricate sustained sessions.
- Collect their top three confusions, one interesting emergent story (with seed and tick), frustration points, whether they voluntarily wanted to continue, and whether a second settlement/trade explanation would address a concrete gap.
- Archive anonymized quotes, dates, test version, real screenshots and defects. A passing automation is not a substitute for this.

Do not assert the game is "fun" merely because testers can click it. Explicitly record both positive and negative evidence, including early quitting.

## Physical browser and scale test protocol (NOT PERFORMED)

On a physical Android phone and a desktop Chromium machine, note model/CPU/RAM, OS/browser version, page URL/commit, power mode, seed, NPC count, and viewport. Test 20, 50 and 100 NPC at 1x/5x/20x, including at least 30 game-days at each selected stress configuration when practical. Measure tick p50/p95 in Node separately from browser FPS, p95 frame time, heap/memory trend, long-frame spikes and whether the UI freezes. Record thermal throttling, reload/save and exact test length. Never compare CI short-run FPS with on-device FPS as if they were the same hardware.

Before 08A engineering, estimate additional settlements with a representative *measured* total NPC budget (do not silently double 100 NPC), event-frequency and shipment concurrency; write expected performance limits and rollback criteria.

## 08A architecture sketch, documentation only

**No new schema, migration or code is implemented here.** Once the gates are approved, write an ADR choosing a world container with stable settlement IDs, shared single-settlement engine rules and a deterministic stable-order settlement tick. Preserve single-village behavior as the regression reference.

Save work first: identify every format-1 sim-v5-phase06 field, capture old real JSON fixtures, define the new version only for an actual semantic schema change, migrate/validate before swapping the active world, and test 500 ticks + save/load + 500 ticks against a continuous 1,000 ticks for multiple seeds and ongoing shipments. Never overwrite a legacy save on failed migration.

For inter-settlement trades: identify the paying owner, selling owner and in-transit escrow owner; transfer finite goods into escrow *once* at dispatch, settle explicit finite currency according to the written contract, and close success/failure without duplication. Transport capacity, travel ticks, route disruption, seller/buyer demise, dead courier, canceled order and restart in transit must be deterministic and tested. Each village still simulates production/consumption/governance; Phaser reads state only. No diplomacy or combat before separate acceptance gates.

## Re-check before changing NO-GO to GO

Attach: production Pages deploy and live screenshot logs; real player observation records; on-device performance/memory measurements; trade hypothesis evidence; severity-ranked issues and owner sign-off on limited 08A scope. Repeat main CI and the save/seed/conservation suites at the latest commit. Update docs/PROGRESS.md with links and a signed GO decision. Until then: **NO-GO**.
