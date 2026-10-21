# T06-D handoff and T06-E gate

T06-D status: **PARTIAL AUDIT / BLOCKED PERFORMANCE VALIDATION**. Baseline GitHub preflight succeeded; repository source can be audited via connector. Local clone failed because container DNS could not resolve github.com; no npm execution or real browser baseline. No optimization diff has been made, and no false completion status is asserted.

Before declaring T06-D CODE VERIFIED, run complete npm gates and tests on final SHA, demonstrate frozen checkpoint/determinism parity, implement only supported performance changes, create before/after tables and verify branch CI. Before declaring PERFORMANCE VERIFIED, record actual before/after browser data on same hardware.

## Next task prompt (T06-E, only after T06-D is actually merged)

Work directly on giabao2605/Tiny-Civilization. Verify live main and T06-D merged PR/merge commit, post-merge CI, documentation and unresolved performance limitations. Create an independent T06-E branch from verified main. Audit npm run build + npm run preview PC-local, no cloud deployment; offline browser runtime, remote network/assets dependencies, JSON save/export/import and atomic bad import, storage persistence, reload and desktop Chromium smoke across viewports. Preserve simulation determinism, save formats 1/2/3 and 8 MiB cap. Run npm ci/audit/typecheck/lint/test/build/Playwright where executable, report NOT RUN/NOT MEASURED honestly, publish a Draft PR but do not merge or deploy. Do not implement T06-F.
