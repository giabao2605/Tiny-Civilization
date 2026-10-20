# A05-C — Visual QA / Evidence

## Automated coverage
`src/game/ambient/visualModel.test.ts` exercises:
- segment-by-segment cart interpolation, invalid/noncontiguous/missing route rejection;
- stable ID -> one handle, cull, re-enter, repeated sync, reset double-clear;
- A05-A deterministic 30-second / 5-minute fixtures with fake handles, and no WorldState mutation;
- reduced-motion pose freeze and model isolation;
- historic v5 48x48, migrated 48x48, native v6 96x96 at 20/50/100 citizens.

Existing director/anchors/route tests additionally exercise rain-to-clear, anchor destruction, co-located NPC separation/death, resets, missing POI and route preflight.

## Acceptance status
| Gate | Evidence | Status |
| --- | --- | --- |
| Pure interpolation & registry isolation | Vitest test source + CI result when available | PENDING CI |
| Renderer actually wired | Static code integration | IMPLEMENTED; browser NOT RUN |
| 30s sign of life **visibly on screen** | Needs live browser screenshot/video, camera framing | NOT RUN |
| 3 categories **visibly on screen** within 5min | Needs live browser or video (fake handles do not suffice) | NOT RUN |
| Clear/cloudy/rain/fog, dawn/day/dusk/night | Source gating from A05-B; browser not captured | PARTIAL |
| 1x/5x/20x + observer 5/10/15 | Presentation clock independent of game tick; live coverage absent | PARTIAL |
| Pause/resume, hidden, reduced motion | Pure tests and static code; browser coverage absent | PARTIAL |
| Camera zoom/pan/follow/AFK, NPC body occlusion | Camera culling code; visual inspection pending | PARTIAL |
| 60min/120min soak, FPS, heap, leak-free | No instrumented real-PC run | NOT MEASURED |

Run local `npm ci && npm run dev -- --host 127.0.0.1`, add `?observerPerf` and compare `?ambientVisuals=off`. Capture exact world seed, snapshot tick, camera mode, screenshot/video, object count before/after cull/reset, Phaser FPS and heap. **Do not mark visual acceptance PASS based solely on Vitest or scheduling counters.**
