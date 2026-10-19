# Fast CI and manually triggered browser verification (N03-E)

**Primary use:** local PC game; GitHub Pages deployment is optional.

| Workflow | Trigger | Command scope |
|---|---|---|
| `.github/workflows/ci.yml` (job `checks`) | push to main, pull request to main | `npm ci`, high-severity production audit, typecheck, lint, all Vitest unit/integration/720h regression, production build |
| `.github/workflows/full-e2e.yml` | **manual** `workflow_dispatch` only | full Fast checks + Chromium install, all Playwright E2E, screenshots/traces on failures, project-path production build and release.spec.ts smoke, 7-day artifacts |
| `.github/workflows/pages.yml` | **manual** `workflow_dispatch` only | old publish checks with Chromium + production smoke, then upload and deploy GitHub Pages only on explicit request |

To run Full E2E: GitHub repository → **Actions** → **Tiny Civilization Full E2E (manual)** → **Run workflow** → choose branch/commit ref → **Run workflow**. Verify the workflow run's `head_sha` matches the final PR commit before treating it as evidence. GitHub may require a workflow to exist on `main` before it exposes its Run workflow button. If this branch-only new workflow is not registered yet, report **NOT RUN**, do **not** secretly re-add browser jobs to CI or use Pages deployment as a workaround.

To publish manually: Actions → **Tiny Civilization Pages** → Run workflow; deployment may modify the public site. Do not run it for an ordinary PR.

Fast CI never installs Chromium, runs `npm run test:e2e`, Playwright production smoke, browser profiling or screenshot artifact copying. There is no `workflow_run` chain auto-dispatching Full E2E or Pages.

**Required-check migration:** existing job name `checks` is preserved; default branch protection was unprotected with no required check list at N03-E audit. If protection is enabled later, require `checks` and keep Full E2E optional. Do not replace tests with skips or publish a misleading green check.

**After merge:** the default `main` runs Fast CI, while Pages and Full E2E remain manual. If project requirements change, modify this explicitly with review rather than restoring a second automatic Chromium workflow.
