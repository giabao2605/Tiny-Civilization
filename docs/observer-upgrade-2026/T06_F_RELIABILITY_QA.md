# T06-F reliability QA
## Tests
Added `WeatherAudio` delayed-resume/destroy regression; no Chromium test added. Existing fast Vitest suite includes coordinator multi-lease/hidden-tab/diagnostics parity, audio loop teardown, save migration/atomicity and frozen SHA checks.

Local npm ci/audit/typecheck/lint/test/build: NOT RUN (terminal DNS cannot resolve github.com; GitHub CI is authoritative if complete on final commit). Exact HEAD workflow: PENDING until observed. Playwright E2E and 60–120 minute soak: NOT RUN. Local PC heap/FPS and GPU resources: NOT MEASURED.

To verify CI: use the T06-F PR check run and compare workflow head_sha to final commit; report each gate only from actual job results. Never silently mark tests PASS from source inspection.
