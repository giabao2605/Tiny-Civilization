# T06-D — Performance QA (local PC first)

Revised policy from owner: **no Chromium benchmark, no heavy browser E2E gate, no deployment**. Use existing Fast CI (production audit, typecheck, lint, Vitest, build) and lightweight pure geometry tests; verify gameplay manually on a PC whenever convenient. Local run: `npm ci` then `npm run dev`; or `npm run build` and `npm run preview`. No Android requirement.

Observed Node/Vitest baseline: 96×96, 100 NPC, seed 12345, 72 ticks, p50=1.803 ms, p95=13.322 ms at #39529797892; routing data is in T06_D_BASELINE_PROFILE.md. These values represent simulation CPU, not FPS. One historical optional Chromium paired run #39531644418 SUCCESS with median rAF FPS 4.26 for both baseline and candidate in CI; no demonstrable aggregate browser benefit. The workflow was removed at user's request.

Code scope: preserve existing static terrain caching; cull only noninteractive static forest images by viewport. No additional clocks, route caches, particle pooling, skipping ticks, heavy benchmark matrix or Web Worker.

PC Windows FPS, GPU/frame-time, heap growth, audio, 60–120-minute soak: NOT MEASURED, not a blocker under updated user scope. If actual local gameplay exhibits regression, revert the culling optimization.
