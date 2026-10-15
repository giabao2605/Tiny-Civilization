# Plan 03 — NPC AI & Navigation | Implementation Specification v2

**Status:** READY FOR TASKING sau Plan 02 map geometry/POI. **Goal:** cư dân có tuyến đường và routine đọc được bằng mắt, nhưng **giữ nguyên các cơ chế sinh tồn, kinh tế, xã hội và chính quyền đang chạy**.  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Simulation Contract](../../SIMULATION_CONTRACT.md).

## 1. Baseline: NPC đã có AI, không được viết lại

- **src/sim/engine.ts** có advanceOneTick, goal schedule, emergency hunger/rest, work/food/sell/build, route fallback, retryAfterTick, blockedGoal, routeBlocked event, travel qua BALANCE.moveTilesPerHour và lastMove.
- **src/sim/world.ts** có Citizen.goal, destination, route, activity, reason, work/home ID, needs, wallet/inventory, relations, household, dead status.
- **src/sim/pathfinding.ts** hiện BFS 4 hướng, stable neighbor order N/E/S/W, diagnostic call count; **src/sim/grid.ts** là geometry.
- **src/sim/social.ts**, **economy.ts**, **governance.ts**, **balance.ts** định nghĩa luật có thật. Không thay priority critical needs, ownership/transactions hoặc id ordering để làm NPC “thông minh hơn”.
- **WorldScene.ts** tween dựa citizen.lastMove; bỏ qua snapshot khi speed cao; path mới phải giữ interface này hoặc cập nhật renderer có test.

## 2. Định nghĩa “NPC sống động” có thể kiểm thử

NPC **có nguyên nhân** cho mỗi hành động: về nhà, đi làm, mua/bán, ăn, xây, tụ tập, trú mưa; người xem có thể chọn NPC và hiểu reason. Không random-walk vô hạn; không teleport, trừ reset/load có lý do rõ. Khi route blocked, chọn lại lộ trình hoặc safe fallback, cooldown để không spam.

**Goal model** giữ existing authority của engine. Có thể bổ sung **leisure/social micro-goals** khi no emergency, nhưng không thay priority: critical health/safety → hunger → rest → economic commitments → social/leisure. “Shelter” weather là mục tiêu mới có điều kiện, phải không cắt ngang giao dịch atomic và không tạo loop starvation.

**Cost model ban đầu (tunable):**

| Terrain/route | Cost |
|---|---:|
| Main road | 1.0 |
| Plaza | 1.0 |
| Side path | 1.1 |
| Footpath | 1.2 (đề xuất bổ sung) |
| Grass | 2.0 (tune trong khoảng 1.8–2.5) |
| Forest | 2.5 (đề xuất, đang walkable) |
| Water/explicit blocked | Không đi được |

Road subtype có thể lấy từ map metadata Plan 02; với legacy 48, dùng mapping terrain cũ (road=1, grass=2, forest=2.5, water blocked). Không tự chặn Site.tile vì nhà vẽ lên tile hiện vẫn là điểm đến gameplay.

## 3. A* deterministic contract

- 4-way grid, Manhattan heuristic × minimum positive cost; priority queue với stable tie-break theo (fScore, gScore, tileIndex) hoặc documented stable ordering; không phụ thuộc Map insertion randomness.
- Tính cost của bước tới neighbor; không cho negative/NaN/0, infinity chỉ cho blocked; start=end trả []; invalid/unreachable trả null.
- Kết quả có cost tối ưu với trọng số đã khai báo, không nhất thiết cùng route BFS nếu có tie; **tuyệt đối không thay kết quả giao dịch/hunger do bug traversal**.
- Chỉ recalc route khi destination/map obstacle thay đổi, route invalid hoặc cooldown cho phép; không tìm đường lại mỗi render frame. Diagnostic counters không ảnh hưởng WorldState.
- Nếu road subtype thay đổi, cache key gồm map revision/terrain-cost version; tránh dùng cache cũ khi map mutation. Budget pathfinding có đo p95, không chốt một số không có baseline.
- Deterministic same seed+commands, same tick → same routes, next goals, event order; no Math.random, no wall-clock.

## 4. Task breakdown

### N03-A — Audit hành vi hiện có và golden fixtures

**Làm:** vẽ flow actual requested goal → target → findPath → route movement → arrival/effects; ghi các priority có sẵn; capture replay seeds 20/50/100 NPC (v5 48 và v6 96 nếu đã có). Liệt kê known stuck/routeBlocked cases.  
**Test:** baseline stateDigest/golden event projection, stock/currency invariants, 24–72 tick selected citizen traces.  
**DoD:** không mô tả sai NPC là random-only, có tài liệu behavior mapping.

### N03-B — Weighted A* core

**Làm:** triển khai A* trong pathfinding.ts hoặc module mới, tách movement-cost function, stable tie-break, geometry per-world; giữ findPath interface hoặc adapter rõ ràng; giữ legacy behavior khi weights uniform nếu cần.  
**Test:** start=end, out-of-bounds, unreachable, weighted detour vs shorter expensive grass, two equal-cost ties, blocked building/entrance, 48/96, deterministic repeated runs. Đối chiếu Dijkstra reference cho một tập grid nhỏ để chứng minh tối ưu.  
**DoD:** không route xuyên water, route chi phí hợp lệ, path call diagnostics và tests xanh.

### N03-C — Integrate routing without economic regression

**Làm:** thay callsites findPath trong engine.ts một cách tối thiểu; giữ route/lastMove/blockedGoal/retryAfterTick, energy travel và activity; route may take longer do weights, cân bằng riêng bằng evidence chứ không đổi ngay BALANCE.  
**Test:** 20/50/100 × nhiều seed × 30 game-days, money supply/food/wood nonnegative, no dead actor, no infinite blocked retry; old v5 continuation and new 96 tests.  
**DoD:** gameplay vẫn chạy, không starvation hàng loạt chỉ do path cost; nếu balance khác, báo metrics và tách PR tuning.

### N03-D — Readable routines, POI và social observation

**Làm:** tận dụng work/home/market/commons; thêm leisure/social stop có điều kiện (POI từ Plan 02) khi needs và obligations cho phép; reason có thể đọc được; pause/idle/social meet có giới hạn duration. Đối với ambient-only “nói chuyện”, có thể dùng event visual từ Plan 05 thay vì sửa social system; không tự tăng affinity hoặc money.  
**Test:** NPC có home/work reachable; arrival and leave; no oscillation goal every tick; goal preemption critical needs; households/social relationship events cũ không thay nghĩa.  
**DoD:** xem một NPC 2–3 ngày game biết họ đi đâu/vì sao; no ghost activity sau death.

### N03-E — Path recovery và future weather hook

**Làm:** unreachable fallback tới home/commons/nearest safe tile với bounded retry; nếu weather shelter cần gameplay state, chỉ thêm hook interface (weather→request shelter) ở giai đoạn này, actual trigger do Plan 04; không override starvation/illness/governance.  
**Test:** chặn route sau khi NPC đã khởi hành; water island; site bị invalid phải fail validation; all routes blocked không crash/spam; resumed after unblock; no teleport.  
**DoD:** mỗi NPC có trạng thái an toàn khi target unreachable, diagnostics hiển thị reason.

### N03-F — Performance và watchability validation

**Làm:** profile path calls per tick, tick p50/p95, route length/cost, failedActions/routeBlocked frequency, movement density; so sánh 48 vs 96, 20/50/100 NPC.  
**Test:** unit + integration + Playwright screenshot/video follow NPC, deterministic replay 100–1000 ticks (mức cụ thể ghi trong PR), 200 NPC synthetic stress nếu có harness.  
**DoD:** pathfinding không làm UI đứng; nếu quá tải, cache/queue/budget sau khi có profile, không dùng worker như phản xạ.

## 5. Sơ đồ xử lý ưu tiên

~~~text
advanceOneTick -> critical needs / commitments / schedule
    -> choose authoritative Goal + destination
    -> if blocked cooldown active: safe fallback
    -> weighted A* on authoritative walkability + cost
    -> bounded movement per game-hour (BALANCE.moveTilesPerHour)
    -> lastMove for Phaser tween
    -> resolve economic/social effects ONLY in engine
    -> emit causal reason/events; snapshot
~~~

**Không có:** LLM API, dialogue, quest, social relationship generation từ cosmetic chatter, extra economy currency, NPC tự dịch chuyển theo RAF, behavior phụ thuộc camera visibility. Offscreen NPC phải có cùng gameplay state như onscreen NPC.

## 6. Acceptance / failure cases

**PASS:**
- 48 legacy và 96 new có route hợp lệ, grass/side path được dùng khi hợp lý, không còn chỉ một lane.
- Deterministic weighted A* và fallback test pass; selected NPC reason đúng; 20/50/100 NPC không stuck phổ biến.
- Không phá ownership, inventory, health, household, election; same seed replay và save/load pass.
- Có profile trước/sau, video hoặc screenshots route demo, path metrics và golden tests.

**FAIL nếu:** agent xóa engine goals cũ để viết FSM mới, dùng Math.random, NPC teleport, route trên nước, tăng failedActions/stock anomalies mà không giải thích, hoặc chỉ demo một NPC mà không chạy regression.

**Rollback:** A* behind routing strategy flag/adapter, có thể fallback BFS legacy; data/schema migration không phụ thuộc A* khi chưa cần. Handoff gồm bảng cost, seed list, benchmark, PR và next task.

## 7. Prompt cho ChatGPT Task

> Đọc Master Observer Upgrade, Plan 03, Simulation Contract, Progress và src/sim/engine.ts, world.ts, pathfinding.ts, balance.ts. Thực hiện **chỉ task N03-[A/B/C/D/E/F]**. NPC đã có goal, route fallback, kinh tế/xã hội/chính quyền: nâng cấp có chọn lọc, không rewrite. Bảo đảm deterministic A*, seed/replay, old save 48, new map 96, invariants. Tạo branch/PR riêng, chạy tests thực tế, ghi screenshot/metrics và next task; không tự merge code.

**Gate sang Plan 04:** stable route/goal + weather shelter hook, regression replay và path performance đã kiểm chứng.
