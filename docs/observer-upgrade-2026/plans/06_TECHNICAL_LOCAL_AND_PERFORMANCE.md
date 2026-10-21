# Plan 06 — Technical / Local Save / Performance | Implementation Specification v2

**Status:** **ENGINEERING IMPLEMENTATION CLOSED 2026-10-21**: T06-A…F MERGED; T06-F final PR SHA Fast CI PASS. **PC HARDWARE / LONG-RUN ACCEPTANCE PARTIAL / NOT MEASURED**; evidence chuyển sang Plan 07, không tự coi Plan 06 đạt toàn bộ physical performance gates.  
**Goal:** nâng presentation/map/ambient trên stack hiện tại, giữ deterministic simulation, save an toàn, PC local chạy ổn và có số đo hiệu năng.  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Contract](../../SIMULATION_CONTRACT.md).

**Closure record:** [PLAN_06_CLOSEOUT.md](../PLAN_06_CLOSEOUT.md) ghi merge SHA, QA evidence, giới hạn và Q07-A handoff. Task breakdown bên dưới là baseline lịch sử, không phải các task chưa bắt đầu.

## 1. Baseline code và contract

**Stack main:** React 19.2, TypeScript 5.9, Vite 7.1, Phaser 3.90, Vitest 3.2, Playwright 1.56; Node 22.12+; npm scripts typecheck/lint/test/build/test:e2e.

**Module ownership:**
- src/sim/world.ts: canonical JSON-compatible WorldState, seeded PRNG, stable entity IDs.
- src/sim/engine.ts: advanceOneTick, fixed-order effects, economy/social/governance.
- src/sim/clock.ts: runtime tick accumulator, no hidden catch-up.
- src/app/livingCoordinator.ts: single owner WorldState/scheduler/commands, UI snapshot batching.
- src/game/createGame.ts + scenes/WorldScene.ts: Phaser renderer, input/camera/tweens.
- src/persistence/save.ts: saveFormat 1, engineVersion sim-v5-phase06, localStorage/import/export JSON, 8 MiB max, strict validation, pending governance command preservation.

**Không cần backend, API AI, auth, Web Worker hay engine rewrite** để đạt mục tiêu ban đầu. Web Worker chỉ khi profiling chứng minh simulation block main thread.

## 2. Bất biến kỹ thuật

1. Determinism: same seed + same commands + same tick count → same canonical state/digest; no Math.random/Date.now/RAF delta trong decision logic.
2. Atomic transactions: food/wood/money, stock capacities, household/social/governance references hợp lệ; dead citizen không hành động.
3. Save: old v5 48×48 phải được đọc và tiếp tục, không mất data; new v6 96×96 có versioned validation; corrupt/oversized save giữ live world nguyên trạng.
4. Rendering: game state không bị camera, FPS, visibility, particle/audio settings làm thay đổi; sim update cố định, UI có thể batch snapshots.
5. Local-first: sau npm ci có thể npm run dev/preview offline ở localhost; game không cần mạng trong runtime, không tự đưa Electron/Tauri.
6. Tests/evidence: không đánh dấu PASS khi chỉ chạy trên giả lập hoặc khi CI chưa chạy; ghi máy/browser/viewport thật.

## 3. Schema migration contract

**Tách read format khỏi write format.** Reader nhận **legacy envelope saveFormat=1, engineVersion=sim-v5-phase06** và new envelope (version tăng có ADR). Validate legacy bằng rules 48×48 cũ **trước** migration. Convert sang canonical new WorldState với width/height 48, weather default deterministic và metadata tối thiểu; giữ nguyên mọi ID, tick, seed, rngState, inventory, wallet, households, governance, pending commands/nextRequestId. Reader không tự expand map. New world generator tạo 96×96; serializer mới chỉ xuất schema mới.

**Golden fixture bắt buộc:** file v5 thật tạo từ baseline engine, có 20/50/100 NPC nếu phù hợp; test import v5 → canonical projection → advance N ticks → export/import new → replay. So sánh projection v5 nếu metadata mới làm full JSON digest khác. Nếu gameplay khác do path/time upgrade có chủ ý, lưu expected diff/ADR và regression checks, không nói “identical” sai.

**Validator:** dimensions 48/96, tiles length, site/POI references, weather finite state, PRNG state, stable IDs, money/stock nonnegative, event bounds, pending commands. Validate full data before coordinator swaps state. 8 MiB cap giữ cho tới khi đo 96×96/100 NPC; lỗi quota/storage không mutate game.

**Version policy:** không đổi giá trị ENGINE_VERSION tùy tiện trong PR art-only. Version bump cùng PR schema migration, có migration tests, README và recovery instructions. Không silently drop unknown fields.

## 4. Performance strategy

**Đo trước khi tối ưu.** Ghi baseline trên main cùng seed, population, viewport, browser và machine:
- frame FPS median/p95 frame time; sim tick p50/p95/max; pathfinding calls/tick; scene objects/particles; memory samples sau 0/15/60 phút; save bytes/load time.
- So sánh 48 vs 96, 20/50/100 NPC; 200 NPC chỉ benchmark harness/stress nếu createWorld chưa hỗ trợ 200.
- Viewports 1366×768, 1920×1080, ultrawide. Target 60 FPS **trên máy dev mục tiêu được nêu rõ**; không suy ra 60 FPS từ unit tests/CI headless.

**Optimization order:** cache/static chunk terrain, viewport culling decorative props, pooling rain/ambient actors, avoid per-frame full-map redraw, avoid allocating per-tile Graphics object, batch React snapshots without skipping engine ticks, measure pathfinding cache. Spatial partition/chunk 16×16 hoặc 32×32 là **đề xuất thử nghiệm**, không khóa khi chưa profile. Offscreen NPC vẫn phải sim đúng; chỉ render/update animation thưa hơn. Web Worker khi tick p95 block UI, có serialization cost test và deterministic replay; không mặc định.

**Tick pacing:** simulation vẫn 1 tick/hour, speed legacy 1×/5×/20×; observer pace là ADR Plan 04, không phải performance hack để bỏ ticks. Hidden-tab resume không catch-up hàng nghìn tick.

## 5. Task breakdown

### T06-A — Preflight audit và baseline CI
**Làm:** xác định main HEAD, branch state, package lock, scripts, CI workflow, deterministic fixtures, current FPS/CPU/memory; ghi module dependency map.  
**Test:** npm ci, typecheck, lint, test, build, test:e2e; lưu logs và browser versions; nếu không có runner ghi NOT RUN.  
**DoD:** baseline số đo + danh sách risks/blockers trước G1.

### T06-B — Architecture boundaries và instrumentation
**Làm:** instrumentation sim tick/path calls/renderer frame, debug overlay có thể tắt, observer diagnostics không tiêu thụ RNG; kiểm tra event listener cleanup và UI snapshot batching.  
**Test:** diagnostics ON/OFF same stateDigest, pause/hidden tab, no double clock, no duplicate Phaser instances after remount.  
**DoD:** performance telemetry hữu ích, không làm game state thay đổi.

### T06-C — Save schema v6 + v5 migration
**Làm:** phối hợp Plan 02/04, implement versioned parser/serializer/validator, golden v5 fixture, map metadata, weather, POI; preserve atomic import.  
**Test:** v5 48 import; v6 48/96 roundtrip; corrupted/oversized/quota failure; pending governance commands; seed/replay; exact IDs and economic projection.  
**DoD:** old saves an toàn, new saves hợp lệ; error messages actionable.

### T06-D — Render/map optimization có profiling
**Làm:** static terrain cache/chunks, culling decorative assets, pooling particles, avoid per-frame full redraw; tối ưu routing cache nếu profile chứng minh.  
**Test:** before/after same hardware and seed, FPS/tick p95/memory, visual screenshot parity, 100 NPC stress; 200 synthetic stress riêng.  
**DoD:** không giảm correctness để đổi FPS; báo số thực, không claim cải thiện khi chưa đo.

### T06-E — Local/offline packaging smoke
**Làm:** npm run build, npm run preview trên localhost, kiểm tra runtime không gọi backend/API, save/export/import JSON, no remote assets required; mô tả hướng dẫn PC local trong README/handoff.  
**Test:** offline browser network mode sau app load, reload, save/restore, audio unlock, 3 viewport.  
**DoD:** local run không cần cloud; không hứa installer desktop khi chưa có.

### T06-F — Long-run reliability và resource cleanup
**Làm:** soak 60–120 phút, sample heap/FPS/tick lag, camera/seed reset/load, scene shutdown/restart, ambient/audio lifecycle; xác định leak thresholds dựa baseline.  
**Test:** 20/50/100 NPC, seed matrix, save cycles, routeBlocked, no unhandled rejection.  
**DoD:** có logs và số đo, nếu thiếu hardware ghi PARTIAL.

## 6. PASS/FAIL, rollback, handoff

**PASS:** legacy v5 import and continuation, new 96 save roundtrip, deterministic tests, all scripts pass, local smoke, instrumentation và profiling có evidence, 60–120min soak khi có môi trường.  
**FAIL:** v5 save bị từ chối im lặng, load reset economy, worker gây nondeterminism, render offscreen thay gameplay, benchmark không có thông số máy, bỏ test để CI xanh.

**Rollback:** giữ legacy reader và backup fixture; feature flags cho chunks/ambient; code optimization PR nhỏ, có before/after; không force-convert file save người dùng.

**Handoff:** schema ADR/version matrix, golden fixtures, benchmark CSV/log, test commands/results, runtime instructions, PR links và unresolved gates.

## 7. Prompt cho ChatGPT Task

> Đọc Master Observer Upgrade, Plan 06, Simulation Contract, Progress, world.ts, engine.ts, clock.ts, livingCoordinator.ts, save.ts và các tests. Chỉ làm **T06-[A/B/C/D/E/F]**. Bảo vệ deterministic simulation, pending governance commands, v5 save 48, v6 96 và atomic import. Không thêm backend/engine rewrite/worker khi chưa có profiling. Tạo branch/PR riêng, chạy tests, ghi hardware/metrics thật, cập nhật handoff, không tự merge code.

**Gates:** T06-A/B trước map migration; T06-C cùng Plan 02/04; T06-D/E/F trước nghiệm thu Plan 07.
