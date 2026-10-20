# T06-A — Implementation record (2026-10-20)

**Task:** Plan 06 Part A only. **Branch:** `feat/t06-a-preflight-baseline`. **Draft PR:** [#41](https://github.com/giabao2605/Tiny-Civilization/pull/41) (OPEN, unmerged). **Verified base main:** `4561660af5c55179df90b73e0d41e5f14b75eede`; [post-A05-E Fast CI #39384084907](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39384084907) SUCCESS on this exact base.

## GitHub preflight

- Repository accessible with push permission; default branch `main`. PR #39 A05-E is MERGED at base SHA. PR #40 T06-F is CLOSED, `merged=false`; comparing `main...d7b042ded3800049b9cc6c300f202b5da7d0b43a` gives **ahead 18 / behind 0 / merge base 4561660af5c55179df90b73e0d41e5f14b75eede**. Its lifecycle patch is **not** in `main` (its branch has been reset to main). Do not import PR #40 code or count it as completed.
- Another unrelated open PR exists on `chore/phase-08-readiness-gates`; no changes from that branch are used here.
- `package.json` and lockfile root agree: 0.9.0, lockfileVersion 3, React 19.2.0, Phaser 3.90.0, TS 5.9.3, Vite 7.1.11, Vitest 3.2.4, Playwright 1.56.1; engines Node >=22.12 <23 and `.nvmrc=22`. Node CI log reports v22.23.3. npm version was **NOT RECORDED** in the CI log, do not guess.
- Reviewed all three workflows: `ci.yml` (push main/PR main: npm ci, production npm audit, typecheck, lint, Vitest, build; NO browser); `full-e2e.yml` (manual `workflow_dispatch`, Playwright Chromium and production smoke); `pages.yml` (manual, potentially deploys, NEVER dispatched here).
- Existing source plans are preserved. This PR changes docs and a Node-only baseline test, not save contracts, world rules, clock, camera, audio or Phaser renderer.

## Implemented in T06-A

1. Evidence-grounded module/data-flow boundary audit: [architecture](T06_A_ARCHITECTURE_AUDIT.md).
2. Determinism, v5/v6/format-3 migration, 48/96 and 20/50/100 coverage inventory: [baseline QA](T06_A_BASELINE_QA.md).
3. Real main CI metrics with machine/runtime and missing PC/browser fields explicitly marked; repeatable Node test `src/sim/t06a.baseline.test.ts` logs `T06A_NODE_BASELINE` for 48/96 x 20/50/100 x seeds 101/12345 (72 ticks per case). It measures tick p50/p95/max, path calls, serialize/parse time and save bytes; its timing is diagnostic, with correctness assertions but no brittle performance gates: [performance](T06_A_PERFORMANCE_BASELINE.md).
4. Prioritized factual risks, repro and owners: [risks](T06_A_RISKS_AND_BLOCKERS.md).
5. T06-B execution prompt and acceptance: [handoff](T06_A_HANDOFF.md).
6. Prepend T06-A status to `docs/PROGRESS.md`, retaining historical entries.

## Execution/evidence boundary

Remote GitHub Actions was available, but this session's local shell **cannot resolve github.com** and no repository checkout was available. Thus `npm ci` etc. were **not run locally**. The base GitHub runner executed the six Fast CI steps successfully on 4561660af5c55179df90b73e0d41e5f14b75eede, and its full job log was inspected. This PR's final commit must be checked separately via GitHub Actions; the PR body is the authoritative final-commit/CI linkage (self-referential SHA cannot reliably be embedded into the commit itself).

**Browser/E2E:** NOT RUN in this T06-A execution; **physical Windows FPS, CPU, process RAM, visual study, audio, soak:** NOT MEASURED. No security findings beyond the successful production audit job are claimed. No merge or deployment.
