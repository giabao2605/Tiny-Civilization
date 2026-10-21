# Plan 07 — QA / Balancing / Polish | Implementation Specification v2

**Status:** READY FOR Q07-A (2026-10-21), nghiệm thu tổng ở G7; **QA chạy xuyên suốt mọi PR**. Plan 06 A–F đã merge; PC-hardware acceptance vẫn PARTIAL.  
**Goal:** chứng minh game quan sát sống động, đúng simulation, lưu được, chạy PC local ổn định; không đánh dấu hoàn thành bằng cảm giác hoặc một screenshot.  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Contract](../../SIMULATION_CONTRACT.md).

**Owner scope after Plan 06:** Chỉ cần game chạy trên PC qua localhost; không Android, cloud, installer hay deploy. Fast CI (production audit, typecheck, lint, Vitest, build) là merge gate; Chromium/Playwright tự động và 60–120 phút soak **không bắt buộc cho Q07-A hoặc merge gate**. Không xóa test E2E lịch sử. Thiếu browser/PC/hardware evidence phải ghi NOT RUN / NOT MEASURED, và không được tự đổi QA-10/QA-11 hay product GO sang PASS. Các bước Q07-C/D/E/F chỉ nghiệm thu thực tế khi có môi trường; không suy diễn từ Vitest.

## 1. Baseline test infrastructure

**Đã có:** Vitest unit/integration trong src/sim/*.test.ts, src/persistence/save.test.ts, src/app/coordinator.test.ts; Playwright Chromium trong tests/e2e/smoke.spec.ts và release.spec.ts; scripts npm run typecheck/lint/test/build/test:e2e; CI GitHub Actions. Phase 06 có save/replay validation và quality gates còn PARTIAL trên thiết bị thật. **Không xóa/skip các test cũ.**

**Mỗi test mới** phải ghi: test ID, fixture seed/population, map size, mode/speed, expected, actual, command chạy, commit SHA, môi trường, pass/fail. Chỉ báo PASS khi có log/bằng chứng. Manual visual test và hardware profile phải được ghi riêng, không thay thế bằng CI headless.

## 2. Test matrix bắt buộc

| Trục | Cases tối thiểu | Loại |
|---|---|---|
| Map | v5 legacy 48×48, v6 new 96×96 | unit/integration/E2E |
| Population | 20, 50, 100; **200 synthetic stress** nếu chưa supported trong UI | benchmark |
| Viewport | 1366×768, 1920×1080, ultrawide (ghi kích thước cụ thể) | E2E screenshot |
| Clock | pause, 1×, 5×, 20×, optional Observer Pace; hidden-tab/resume | unit/E2E |
| Time | dawn 06, day 12, dusk 18, night 23 | screenshot |
| Weather | clear/cloudy/rain/fog, transition, post-rain puddle | fixture/E2E |
| Routing | roads, grass detour, unreachable, blocked mid-route, shelter | unit/integration |
| Save | v5→v6, v6 roundtrip, malformed/oversized/quota, pending commands | unit/E2E |
| Camera | drag/zoom/fit/reset/follow/AFK, resize, NPC click, death/reset | E2E |
| Audio | locked autoplay, unlock, mute, hidden-tab, one-shot budget | E2E/manual |
| Observer | 30s sign-of-life, ≥3 event categories/5min, 20–30min sequence | fixture/video |
| Reliability | 60–120min soak, repeated save/load/reset, no unhandled errors | manual/automation |

**Seed matrix:** ít nhất 10 deterministic seeds cho 96 generator và 20/50/100; lưu số seed cụ thể trong test fixture, không ghi “random seed passed”. Có ít nhất một fixture có rain/shelter, một fixture invalid route, một legacy v5 golden save. Same seed+commands must reproduce world digest và events/projection; observer cosmetic events phải test bằng virtual time/seed riêng.

## 3. Product acceptance test IDs

| ID | Test hành vi | Tiêu chuẩn PASS |
|---|---|---|
| QA-01 | Visual identity | ≥4–6 silhouette nhà rõ, terrain edge/variation, 3 district nhìn khác nhau ở overview |
| QA-02 | Camera | pan/zoom/fit/reset/follow; AFK không jump, manual override; click NPC đúng sau resize |
| QA-03 | World | 96×96 = 9216 tiles, 3 district, ≥20 valid POI/anchors, economic sites reachable |
| QA-04 | Routing | A* weighted deterministic, side path/grass usable, blocked fallback finite, no teleport |
| QA-05 | NPC life | home/work/market/commons có reason, needs priority và transaction/social/governance không regression |
| QA-06 | Time | bốn pha day/night nhận ra khi tắt HUD, NPC schedule khớp giờ canonical |
| QA-07 | Weather | clear/cloudy/rain/fog; rain có lighting+map+audio+NPC, tắt particle vẫn phân biệt |
| QA-08 | Ambient | 30s có dấu hiệu sống, 5min ≥3 **categories** trong observer fixture, 20–30min có diễn biến |
| QA-09 | Save | v5 48 giữ state, v6 96 roundtrip, invalid import atomic, seed/replay deterministic |
| QA-10 | Performance | target 60 FPS trên máy dev mục tiêu có mô tả, p95 frame/tick không gây đứng; test 20/50/100, 200 stress |
| QA-11 | Reliability | soak 60–120min, no path deadlock phổ biến, no unbounded memory, no unhandled errors |
| QA-12 | Local UX | chạy local không backend/API bắt buộc, mute/reduced-motion, HUD không che map |

**Chính sách kết quả:** PASS / FAIL / PARTIAL / NOT RUN. Không có “PASS tạm” cho thiếu screenshot hoặc chưa benchmark máy thật. Nếu 200 NPC chỉ chạy harness synthetic, báo đúng “stress only”, không claim game support 200 NPC trong UI.

## 4. Balance metrics không phá simulation

**Ghi theo seed/population/time horizon:**
- living citizens, homeless, hungry, dead, health/energy distributions;
- food/wood produced/consumed, market cash/stock, totalCurrency invariants;
- routeBlocked events per 1000 ticks, failedActions, path calls/tick, average trip length, unreachable targets;
- social encounters/disputes, household births/deaths, election/shock events;
- event categories per 5 real minutes trong observer mode; frame FPS median/p95, sim tick p95, heap growth.

**Không rebalance tùy tiện** hunger, prices, mortality, social, tax chỉ để weather/map nhìn vui. Nếu path cost hoặc pacing gây starvation, tạo issue với metrics, sửa bằng PR balancing riêng, golden fixtures trước/sau và giải thích tác động. Cần phân biệt thay đổi **nhịp real-time** với kết quả sau **N game ticks**.

## 5. Task breakdown

### Q07-A — Test plan và fixtures
**Làm:** lập manifest seed/population/map/speed/viewport, legacy v5 save fixture, weather fixture, event fixture; map QA-01…12 tới unit/E2E/manual.  
**Test:** fixtures deterministic, test setup/teardown clean, no external API.  
**DoD:** không có acceptance nào thiếu cách đo hoặc người phụ trách.

### Q07-B — Automated regression expansion
**Làm:** unit tests for map geometry, path weighted/determinism, weather state, migration, ambient virtual clock, audio settings; Playwright camera/responsive/weather/observer smoke.  
**Test:** npm ci, typecheck, lint, test, build, test:e2e, logs/CI artifacts.  
**DoD:** mọi PR feature có regression test phù hợp, không skip legacy suite.

### Q07-C — Visual and UX review
**Làm:** screenshot matrix cùng seed/tick, before/after 48→96, 4 time phases, 4 weather states, camera modes, HUD accessibility, zoom fit; kiểm tra art coherence và readable NPC.  
**Test:** 1366×768, 1920×1080, ultrawide, selected NPC, reduced motion, audio mute.  
**DoD:** reviewer có thể so sánh khách quan, không chỉ nhận xét “đẹp hơn”.

### Q07-D — Watchability study
**Làm:** 30s, 5min và 20–30min sessions ở observer fixture và ít nhất 2 seeds tự nhiên; ghi timeline loại event, đoạn không hoạt động, sự kiện bị lặp, camera motion discomfort.  
**Test:** 5min ≥3 distinct categories ở fixture, 20–30min có state progression; không bịa event bằng cách mutate economic WorldState.  
**DoD:** có capture/timeline, gaps được giải quyết hoặc ghi issue.

### Q07-E — Performance/soak & save safety
**Làm:** benchmark 20/50/100 + 200 synthetic, 48/96, 3 viewports, 60–120min soak; repeat load/save/reset, audio/camera/particle lifecycle; hardware report.  
**Test:** FPS median/p95, tick p95, memory samples, save bytes/load time, no unhandled errors.  
**DoD:** evidence cho target 60 FPS; nếu không có máy thật, PARTIAL chứ không PASS.

### Q07-F — Release candidate review và final go/no-go
**Làm:** kiểm tra toàn bộ QA-01…12, mở issues cho FAIL/PARTIAL, xác minh branch merge, docs/PROGRESS, save migration, offline local smoke; tạo bảng risk residual.  
**Test:** full CI trên merge commit + local smoke + manual review.  
**DoD:** quyết định GO khi mọi blocker P0/P1 giải quyết; NO-GO nếu save loss, deterministic break, crash, core watchability fail.

## 6. Severity, gates, và rollback

| Severity | Ví dụ | Quy tắc |
|---|---|---|
| P0 | mất save, stock/tiền sai, corrupted state, app không chạy | block merge/release |
| P1 | NPC mắc kẹt hàng loạt, weather không có 4 lớp, camera unusable, serious FPS drops | block workstream VERIFIED |
| P2 | một asset thiếu variation, âm thanh cân bằng chưa tốt, UI polish | issue + ưu tiên sau |
| P3 | cải tiến nhỏ, cosmetic edge case | backlog |

**Rollback:** mỗi PR có scope nhỏ; giữ v5 parser, fixture và migration; không thay live save nếu rollback. Bug reproducible phải có seed/tick, screenshot/log và steps. Đừng đổi expected snapshot chỉ để test pass nếu không có ADR.

## 7. Bàn giao chuẩn

Mỗi task gửi: commit SHA/PR, files changed, tests commands + actual results, screenshot/video/benchmark links, seed/tick/viewport/hardware, list PASS/FAIL/PARTIAL/NOT RUN, risk, rollback, next task. **PROGRESS** chỉ ghi DONE khi gate đủ bằng chứng; không đánh dấu Phase 00–08 thành Observer Upgrade.

## 8. Prompt cho ChatGPT Task

> Đọc Master Observer Upgrade, Plan 07, Simulation Contract, Progress và toàn bộ test harness. Chỉ làm **Q07-[A/B/C/D/E/F]**. Kiểm thử trên code thực, không viết test giả chỉ để pass. Chạy unit/E2E và visual/performance theo scope, ghi seed/viewport/hardware/test logs, đánh dấu PASS/FAIL/PARTIAL/NOT RUN. Bảo vệ v5 save và deterministic replay, không bỏ tests cũ. Tạo branch/PR riêng, cập nhật PROGRESS và handoff; không tự merge code.

**Gate hoàn thành:** chỉ GO khi QA-01…12 có bằng chứng và các lỗi P0/P1 đã được giải quyết hoặc có quyết định ngoại lệ minh bạch.
