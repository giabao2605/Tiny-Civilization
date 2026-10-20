# T06-C — Validation, atomic import and storage QA

| Case | Mechanism / coverage | State |
| --- | --- | --- |
| JSON truncated/corrupt, missing envelope, unknown format/engine | `save.test.ts`, `v6.test.ts`, new integrity suite | Automated coverage |
| v5 schema/48×48 tile mismatch, nonexistent IDs, invalid wallet/resources | `save.test.ts`, `legacy-v5.fixture.test.ts` | Automated coverage |
| 96×96 layout/POI/routes/water/off-map references | `v6.test.ts`, `validateWorld96Layout` | Automated coverage |
| Weather missing/extra/invalid; old v6 format 2 and current format 3 | `weather.test.ts`, `v6.test.ts`, new synthetic historical tests | Automated coverage |
| Pending request ordering, future tick, duplicate ID, `nextRequestId`, nonexistent leader | `validatePending`, new T06-C tests | Guard implemented |
| UTF-8 bytes >8 MiB where JS string length is smaller | new integrity suite | Automated coverage |
| Invalid import while coordinator paused/running | new integrity suite, `v6.test.ts` | Automated coverage; not real-browser timing |
| localStorage unavailable, SecurityError, quota exceeded | `App.tsx` try/catch and unchanged single-slot `setItem` | Static inspection; real browser **NOT RUN** |
| Clock/lease/metrics after reset/import | `t06b.instrumentation.test.ts`, `livingCoordinator` | Unit/mock checks; physical PC **NOT RUN** |
| Forged pending leader via actual Chromium file input, unchanged localStorage, 1 canvas/clock lease | `tests/e2e/t06c-save-integrity.spec.ts` | Browser regression **NOT RUN** |
| Legacy browser v5 import and current writer format assertion | `tests/e2e/observer-w02-e-production.spec.ts` (corrected obsolete format-2 assertions to v3) | Browser regression **NOT RUN** |

Import path: parse+validate → optional migration → **only then** clear movement diagnostics, restore pending+ID, reset runtime elapsed and pause on successful import. Error before swap preserves old `WorldState`, saved JSON, simulation settings, request counter and scheduler leases. UI `restore` resets audio only after import succeeded. Avoid claiming every storage driver uses the same localStorage quota/exception behavior.

## Manual Chromium / Windows PC-local recipe (pending)
1. `npm ci && npm run dev` on a local PC; use Chromium desktop.
2. Observe a seeded 96×96 village through multiple ticks; pause and save to localStorage; reload browser and load; verify saved tick/RNG/IDs, then resume.
3. Export JSON, import file, compare authoritative state before/after; import archived v5 fixture decoded from base64+gzip and continue.
4. With a saved good slot, try truncated JSON, forged pending IDs, mismatched version and >8 MiB UTF-8; verify on-screen error, **unchanged** active world, pause/speed, pending commands and localStorage slot.
5. Test browser profile with blocked storage/quota limits separately; reset seed, import repeated times, turn diagnostics ON/OFF and check one Phaser instance / one simulation timer.
6. `npx playwright install chromium && npm run test:e2e` if browser and repo checkout are available. Record browser version, OS, viewport, raw result, screenshots and whether test used real localStorage vs mocks.

Physical-browser localStorage quota, Windows CPU/GPU/heap and long soak: **NOT RUN / NOT MEASURED** until real evidence is attached.
