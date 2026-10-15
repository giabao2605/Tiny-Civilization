# Plan 02 — World / Map Expansion | Implementation Specification v2

**Status:** READY FOR TASKING, chỉ code sau G1. **Goal:** new world 96×96, 3 districts, đường đa tuyến, ≥20 POI/event anchors; **legacy save 48×48 vẫn nguyên trạng**.  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Contract](../../SIMULATION_CONTRACT.md).

## 1. Baseline / ràng buộc thực tế

- **src/sim/grid.ts:** GRID_WIDTH=48, GRID_HEIGHT=48, TILE_PIXELS=12; tileIndex/isValidTile đang dựa constants.
- **src/sim/world.ts:** createWorld(seed, population 20/50/100) tạo tiles bằng RNG, hai vùng nước, homes/work/commons/market, resource nodes; các vị trí/các kết nối được hardcode quanh (24,24); Site IDs và citizen.homeId/workId có liên hệ với economy/social.
- **src/sim/pathfinding.ts:** BFS dùng GRID_WIDTH khi decode tile index; **src/game/createGame.ts** và **WorldScene.ts** dùng GRID_WIDTH/HEIGHT để tạo canvas/camera/terrain; **src/persistence/save.ts** validate vị trí theo grid 48.
- **src/sim/economy.ts**, **engine.ts**, **governance.ts** có thể có phụ thuộc vào vị trí/khả năng đi lại. Phải search tất cả references trước khi sửa. Không giả định đổi hai constants là đủ.

## 2. Map contract và chiến lược migration

**Decision:** WorldState schema mới có metadata width/height per-world (đề xuất **map: { width, height, ... }** hoặc trường tương đương được ADR xác nhận), còn tiles hiện tại tiếp tục là authoritative terrain array để giảm thay đổi. Mọi helper index/validTile nhận dimensions từ world hoặc explicit map size. TILE_PIXELS là đơn vị hiển thị, không phải kích thước simulation. New worlds mặc định 96×96 **chỉ khi** seed validation và migration tests pass.

**Save v5:** parse/validate bằng quy tắc v5, migrate sang schema mới **nhưng giữ 48×48**, không mở rộng ngầm. Giữ seed/tick/rngState/nextEntityId/nextEventId/citizen/site IDs, vị trí, hàng hóa, tiền, quan hệ, households, pending commands. Old save phải tiếp tục chạy tiếp theo cùng quy tắc gameplay; không được âm thầm đổi economy. Nếu không thể giữ exact digest do thêm metadata, so sánh **projection canonical v5** và deterministic continuation, có documented diff. Bản v5 fixture phải được lưu trong test.

**New worlds:** 96×96 = 9216 tiles, 3 district (Residential, Civic/Market, Nature/Waterfront), 20+ **anchors/POIs hợp lệ**; POI trang trí phải có ID/coordinate ổn định nhưng không giả làm Site kinh tế. Existing SiteKind chỉ có home/work/commons/market: không đổi enum tùy tiện. New metadata cho district/entrance/roadKind phải có validator, seed determinism và giới hạn bộ nhớ.

**Đường:** main road, side street, footpath, plaza là hierarchy; grass vẫn walkable; water blocked; forest hiện walkable và cần giữ trừ khi ADR riêng. Building art footprint không được chặn tile site/entrance gameplay. Road subtype có thể là metadata riêng, giữ Terrain='road' cho engine v5 khi phù hợp. Đừng trộn decorative road và movement cost trước Plan 03.

## 3. Layout target / density

| District | Gameplay hubs bắt buộc | Props và ambient anchors |
|---|---|---|
| Residential | homes, walkable entrance, link tới market/work | garden, laundry, well, alley, pets, doorstep |
| Civic/Market | existing market, commons/plaza, work sites, ≥2 lối ra | stall, cart route, bell, gathering points |
| Nature/Waterfront | water/bridge/park path, accessible nature POIs | birds, pond ripple, bench, trees, fishing ambience |

**Generation pipeline đề xuất:** (1) reserve protected sites/entrances; (2) generate terrain/water; (3) allocate 3 district regions; (4) lay main/secondary road graph connecting functional sites; (5) verify connectivity, fix deterministically; (6) place functional sites/resources preserving economic capacities; (7) place non-blocking decorative POIs/props; (8) validate seed and publish world. Nếu procedural generator chưa đạt chất lượng, chấp nhận deterministic authored template + seeded variation trước; không buộc Tiled rewrite.

**Connectivity:** tất cả living NPC spawn và functional site/resource node phải reachable trên walkable grid. District hubs phải có **≥2 tuyến khác nhau** trong test có thể kiểm tra bằng cách chặn một đoạn đường chính rồi tìm lại tuyến hợp lệ (nếu layout có choke bridge bắt buộc, ADR ngoại lệ phải ghi rõ). Test không được chỉ đếm đường màu vàng mà bỏ qua grass walkable. Các entrance phải không nằm dưới tile water hoặc blocked.

## 4. Task breakdown

### W02-A — Inventory geometry và ADR schema

**Làm:** grep mọi GRID_WIDTH/HEIGHT, tileIndex, isValidTile, 48, site coordinate, save validator, screenshot size; lập bảng module phụ thuộc. Chốt interface dimension-aware (đọc từ world), giữ API compatibility cho tests v5 nếu cần. Tạo fixture v5 **trước khi đổi schema**.  
**Test/DoD:** list đủ callsites, baseline v5 fixture parse/advance/digest, ADR nêu rõ strategy v5 giữ 48, v6 new 96, version bump.

### W02-B — Dimension-aware core, legacy mode

**Làm:** refactor grid helpers, routing, world generation/validation, renderer bounds/camera theo dimensions; không tạo 96 map trong PR này nếu có thể. Legacy 48 worlds vẫn render, pathfind, save/load.  
**Test:** 48 index boundary (0,0),(47,47), invalid (48,48); route; all legacy unit/E2E; no path overflow; resize/zoom fit.  
**DoD:** không còn assumptions 48 trong code chạy world mới, trừ compatibility/fixtures có ghi chú.

### W02-C — 96×96 generator + districts

**Làm:** deterministic layout; protected home/work/market/commons/resources; 3 district; 96×96 array; validate all sites, IDs, roads, spawn, capacity; stable same seed. Không thay công thức tiền/hunger/social.  
**Test:** ít nhất 10 seeds số cụ thể cho 20/50/100 NPC; same seed exact layout and economic projection; 9216 tiles; no water spawn; all economic sites reachable; no negative stock.  
**DoD:** generator không cần retry vô hạn, có max attempts/fallback deterministic, không map rỗng.

### W02-D — Road graph, entrances, POI/visual metadata

**Làm:** main/side/footpath/plaza subtype + grass walkable; >=20 POI/event anchors; add district IDs/anchor kind metadata; define functional vs decorative ownership; wire rendering từ Plan 01; metadata không tạo site kinh tế ngoài dự kiến.  
**Test:** 3 district IDs, 20 unique valid anchors, at least 2 routes for main hubs, obstruction recovery, building entrances; snapshots cùng seed; selected NPC click.  
**DoD:** overview nhận ra 3 district, main routes không chỉ một dấu cộng qua center.

### W02-E — Migration, save/load, regression

**Làm:** v5→v6 migration ở persistence layer theo Plan 06, validator nhận cả map 48/96; export v6; corrupt/missing dimensions báo lỗi atomic; confirm v5 continuation semantics; documentation về không auto-expand old save.  
**Test:** v5 fixture import → v6 export → reimport → advance; old 48 map unchanged; new 96 roundtrip; invalid save leaves live world intact; engine replay + economy/social/governance tests.  
**DoD:** không mất dữ liệu; không silent reset/teleport; version error có hướng dẫn.

### W02-F — Density và map performance

**Làm:** inspect viewport 1366×768, 1920×1080, ultrawide; kiểm tra không quá trống, tile layer/culling nếu cần; benchmark map generation, initial render, 20/50/100 NPC.  
**Test:** screenshot 3 districts, path calls/tick, FPS + heap sample, local smoke; stress 200 only synthetic/benchmark unless supported.  
**DoD:** 96 map chạy ổn định; nếu perf chưa đạt, ghi gate PARTIAL và tối ưu trước Plan 03.

## 5. API/schema checklist trước merge

- Không global constant nào làm sai index với world 96; array length = width×height, integer width/height trong supported set 48/96.
- WorldState metadata không chứa Phaser object; validation giới hạn length, IDs, coordinates, POI kinds, references.
- No duplicate site IDs, no dangling home/work/site IDs, all existing trade/household references intact.
- Seed/RNG path ổn định và test; route engine có thể dùng BFS đến Plan 03.
- UI reset seed mặc định 96 chỉ khi migrations verified; v5 imported world 48 không bị tự reset bởi UI.
- Save 8 MiB cap được đo với 96×96, 100 NPC; không nâng cap tùy tiện khi chưa đo.
- Old Phase 00–08 docs vẫn nguyên trạng; cập nhật PROGRESS bằng evidence.

## 6. Scope exclusions, nghiệm thu, rollback

**Không làm trong Plan 02:** đổi 1 tick/hour, A* cost, NPC FSM mới, thời tiết, seasons, economy rebalance, full Tiled editor integration nếu không cần.  
**PASS:** W02-A…F verified, new 96 world 3 district/20+ anchors, functional site connectivity, v5 save 48 preserved, v6 save roundtrip, legacy tests pass, camera Plan 01 không lỗi.  
**Rollback:** có feature flag/newWorldSize để tạm trở về new 48 nếu generator fail; không ghi đè file save cũ; PR migration tách khỏi art/content để revert được.  
**Handoff:** schema ADR, generator seed list, migration fixtures, screenshots, benchmark và PR links.

## 7. Prompt cho ChatGPT Task

> Trong repo giabao2605/Tiny-Civilization, đọc Master Observer Upgrade, Plan 02, Simulation Contract, Progress và code hiện hành. Chỉ thực hiện **W02-[A/B/C/D/E/F]**. Phải bảo vệ save v5 48×48, IDs, seed/RNG, economy/social/governance và không âm thầm đổi thời gian. Audit callsites trước khi sửa; có unit/E2E, seed matrix, screenshots và migration evidence đúng task. Tạo branch từ main, PR riêng, ghi test thật và blocked items; không tự merge code, không làm task khác.

**Gate sang Plan 03:** map geometry/schema và routing endpoints ổn định, migration verified; weighted A* chỉ được thêm sau đó.
