# Q07-D verification evidence
- Preflight: PR #50 merged; main `cae75df7695ab6bff1e869b1135d86b1de5be43e`; [post-merge CI #39575483638](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39575483638) completed/success on exact main SHA.
- Test ID: `src/game/ambient/q07d.watchability.test.ts`. New tests verify distinct category counting, rejection of invisible/unrendered/unobserved events and inability to claim human observation from 300000ms synthetic fixture.
- Existing tests reused: `src/game/ambient/ambient.test.ts`, `src/game/ambient/director.test.ts`, `src/game/camera/afkDirector.test.ts`, `src/sim/n03f.watchability.test.ts`.
- Fixture: `Q07-ambient-virtual`, seed 107, 20 NPC, 96×96, tick 7, 300000 **virtual** ms. Natural reference seeds 101 (tick 0–48) and 127 (tick 0–96) are NOT actually watched.
- Local `npm ci` blocked by GitHub DNS; local typecheck/lint/Vitest/build NOT RUN. Await exact PR SHA Fast CI via GitHub Actions. CI result recorded separately after execution, never borrowed from Q07-C.
- Desktop video evidence 30s/5min/20–30min: NOT RUN. Rendered/human-observed distinct event count: UNKNOWN, not zero proved. FPS, heap, GPU: NOT MEASURED.
