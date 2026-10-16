# Living Settlement / Observer Upgrade — MASTER IMPLEMENTATION PLAN v2.0

**Ngày chốt kế hoạch:** 2026-10-15 | **Trạng thái:** READY FOR TASKING (tài liệu; KHÔNG có nghĩa code đã hoàn thành)  
**Repository:** giabao2605/Tiny-Civilization | **Workstream:** Observer Upgrade 2026  
**Nguồn định hướng:** [Deep Research gốc đã lưu](RESEARCH_SOURCE.md). Đây là **bản thiết kế triển khai mới**, không tự nhận là bản DOCX gốc.  
**Luật ưu tiên:** [Simulation Contract hiện hành](../SIMULATION_CONTRACT.md), [Progress](../PROGRESS.md), [Legacy Master Plan](../MASTER_PLAN.md). Các đề xuất ở đây không tự động thay đổi contract cũ.

## 0. Cách dùng tài liệu

Mục đích của bộ kế hoạch: một ChatGPT Task/AI coding agent đọc Master + đúng một plan con, kiểm tra repository thật, thực hiện **một lát cắt nhỏ**, chứng minh bằng test/screenshot/benchmark, cập nhật handoff rồi mở PR. Không chạy cả bảy plan trong một task. Không đánh dấu DONE chỉ vì đã tạo file.

**Thứ tự đọc bắt buộc:** README repo → docs/PROGRESS.md → docs/SIMULATION_CONTRACT.md → tài liệu này → plan con liên quan → source/test thật. Nếu tài liệu mâu thuẫn với code, **không âm thầm chọn một bên**: ghi rõ discrepancy, chọn phương án giữ bất biến và giải quyết bằng ADR/test trước khi sửa.

**Các trạng thái:** PROPOSED (ý tưởng) → READY (đủ contract, phụ thuộc) → IN PROGRESS → VERIFIED (CI + bằng chứng) → MERGED. Bản plan READY không chứng nhận feature đã có.

## 1. North Star và ranh giới sản phẩm

**North Star:** “Một ngôi làng nhỏ tự sống: người xem có thể không chạm chuột, nhưng vẫn thấy cư dân có mục đích, không gian có bản sắc, ánh sáng/thời tiết chuyển đổi và những chuyện nhỏ phát sinh có nguyên nhân.”

Đích đến là **pixel-art top-down 2D giàu chi tiết, coherent/believable**, không phải photorealism, 3D, city builder hay screensaver thuần túy. Người dùng mục tiêu là người thích mở game trên PC local để quan sát. Game vẫn có inspector và các điều khiển hiện tại nhưng không yêu cầu thao tác liên tục.

**Vòng lặp quan sát:**
- 30 giây: ít nhất một dấu hiệu sống (NPC di chuyển có mục đích, gặp gỡ, chim, khói, đèn hoặc hoạt ảnh môi trường).
- 5 phút: ít nhất ba **loại** micro-event khác nhau trong seed/fixture nghiệm thu, không đếm ba lần cùng một hiệu ứng.
- 20–30 phút: có chuỗi trạng thái quan sát được, ví dụ trời đổi → cư dân trú → phố thưa → trời quang → hoạt động trở lại.
- Các mốc trên là **mục tiêu đo trong observer mode/fixture đã khai báo**, không phải lời hứa mọi seed ngẫu nhiên luôn sinh đúng số event.

**Ngoài phạm vi upgrade này:** 3D, multiplayer, backend, tài khoản, AI/LLM mỗi NPC, combat, quest/dialogue tree, mùa, tuyết, đại lễ hội, thêm hệ kinh tế mới, thay toàn bộ engine, port Electron/Tauri ngay lập tức. PC local = chạy Vite build/preview hoặc localhost không cần cloud; đóng gói desktop chỉ xem xét bằng ADR riêng sau khi đạt nghiệm thu.

## 2. Baseline thực tế, không xây lại những gì đã có

Đã đối chiếu branch main tại commit 1d56f019 (2026-10-15). Mọi agent phải kiểm tra lại HEAD trước khi code.

| Hệ thống | Đã tồn tại | Hướng nâng cấp | Điểm không được phá |
|---|---|---|---|
| Stack | React 19 + TS + Vite 7 + Phaser 3.90, Vitest/Playwright | Tiếp tục dùng stack | Không rewrite engine |
| Simulation | src/sim/engine.ts, world.ts; deterministic seeded, 1 tick = 1 giờ | Bổ sung presentation/behavior có kiểm soát | Kinh tế, nhu cầu, quan hệ, chính quyền, stable IDs |
| Clock | src/sim/clock.ts; 1×/5×/20×, 2/10/40 tick/s mục tiêu | Observer pacing là thí nghiệm riêng | Không âm thầm đổi tốc độ và lịch sử |
| Grid | src/sim/grid.ts; 48×48, 12 logical px/tile | 96×96 cho **new worlds**, dimensions theo world | V5 saves 48×48 vẫn đọc được |
| Routing | src/sim/pathfinding.ts BFS, thứ tự láng giềng cố định; blocked retry có sẵn | Weighted A* nếu chứng minh có ích | Determinism và route fallback |
| Camera | WorldScene.ts đã có wheel zoom 1–3, drag pan | Fit/reset/follow/AFK, viewport và clamp | Click chọn NPC, tween và lifecycle |
| Rendering | WorldScene.ts vẽ procedural bằng Graphics, scene 576×576 | Art kit/layers, responsive sizing, shadow | Không đặt business logic vào renderer |
| Persistence | src/persistence/save.ts, format 1, engine sim-v5-phase06, giới hạn 8 MiB | Versioned migration nếu schema đổi | Không sửa trực tiếp save cũ, import atomic |
| Gameplay | 20/50/100 NPC, market, food/wood, household, election, shocks | Thêm quan sát, không reset gameplay | Không thay tiền, stock, PRNG một cách tình cờ |

**Chú ý:** báo cáo Deep Research mô tả camera tĩnh/NPC đơn giản là chẩn đoán prototype qua ảnh. Code mới hơn đã có camera và các hệ gameplay; ưu tiên sự thật của repository. Phần nghiên cứu tham khảo và chỉ tiêu sản phẩm được giữ trong [RESEARCH_SOURCE.md](RESEARCH_SOURCE.md).

## 3. Các quyết định kiến trúc bắt buộc (ADR locks)

### ADR-01: Simulation clock và nhịp quan sát

**LOCKED cho các task 01–03:** 1 engine tick = 1 game-hour; 24 tick/ngày; 1×/5×/20× như contract; pause = 0 tick; không catch-up khi tab hidden; mọi gameplay dựa trên tick, không dựa Date.now/RAF. **Không đổi ngay thành 15 phút/ngày** như nghiên cứu gợi ý, vì sẽ đổi tốc độ đói, làm việc, sinh đẻ, kinh tế và nhịp render 75 lần.

**Thí nghiệm bắt buộc ở Plan 04:** prototype “Observer Pace” tách biệt với legacy speeds, ví dụ 24 tick/900 giây (37,5 giây/game-hour), nhưng **chỉ bật làm mặc định sau khi** (a) không thay số tick hoặc kết quả cùng seed/commands, (b) tween/ambient đủ chuyển động giữa hai tick, (c) 30s/5min watchability pass, (d) người dùng hiểu sự khác biệt “observer pace” và “fast simulation”. Nếu fail, giữ legacy 1× và ghi quyết định, không giả lập một đồng hồ ngày đêm trái ngược với giờ NPC. Không thay clock canonical, không tự ý đổi preset 1×/5×/20×. Trước khi làm feature time, ghi ADR kết quả vào plan 04/PR.

### ADR-02: Determinism và PRNG

WorldState JSON-serializable; advanceOneTick là nguồn thay đổi gameplay duy nhất. Stable citizen IDs, thứ tự giải quyết giao dịch, stock/money không âm, dead NPC không hoạt động, pending governance commands và rngState phải được bảo toàn. **Không dùng Math.random, Date.now, RAF delta để quyết định gameplay.** Cosmetic animation được phép theo thời gian render nhưng không được tác động vào simulation. Weather/ambient cần PRNG riêng có state lưu hoặc deterministic hash từ seed/tick; **không tiêu thụ rngState kinh tế hiện hành** chỉ để vẽ chim/mưa.

### ADR-03: Map và save tương thích

96×96 là **kích thước new-world target**, không phải lệnh ép mọi save 48×48 lên 96×96. Khi thay grid, kích thước phải đi cùng WorldState/map metadata, không dùng global 48/96 cố định cho mọi bản save. Chọn chiến lược **migrate v5 save → schema mới nhưng giữ map 48×48 nguyên trạng**; new worlds 96×96 được tạo mới. Không dịch chuyển site, citizen, homeId, workId, tick, tiền, inventory, quan hệ hay PRNG của save v5. Bất kỳ thay đổi save format phải có version bump, parser cũ được kiểm thử, validator mới và rollback thông báo lỗi rõ ràng. Không claim “tương thích” khi chưa có fixture save v5.

### ADR-04: Layer ownership

src/sim sở hữu authoritative WorldState, path, schedule, resource, causal events; src/app/livingCoordinator.ts sở hữu runtime scheduler/commands/save boundary; src/game sở hữu tile art, camera, tween, particle, ambience và cosmetic-only agents. Presentation không tạo/gỡ tài nguyên, không sửa trực tiếp WorldState. Site gameplay có ID và tile hợp lệ; POI trang trí không được ngầm trở thành site kinh tế. Có thể dùng Tiled nếu mang lại lợi ích, **không bắt buộc chuyển pipeline** chỉ để đạt 96×96.

### ADR-05: Bảo vệ dữ liệu và phát hành

Tất cả task làm trên branch mới, PR riêng, không đẩy code thẳng main; test phải có bằng chứng. Legacy Phase 00–08 và progress không được viết lại thành “DONE” cho upgrade. Tài liệu upgrade có đường dẫn độc lập. Không backend/cloud/deploy là điều kiện hoạt động local, không cấm build web hiện tại.

## 4. Mô hình hệ thống đích

~~~text
createWorld(seed, size) -> WorldState + map metadata (48 legacy / 96 new)
   -> advanceOneTick(world, commands) [deterministic, economy/social/governance intact]
   -> coherent snapshot -> coordinator -> Phaser WorldScene + React HUD
                                          |-> layered terrain/buildings/props
                                          |-> camera + selected NPC + tweens
                                          |-> light/weather/particles/ambient SFX
                                          |-> cosmetic-only ambient actors
   -> versioned local save/import/export + validation + replay
~~~

**Các schema đề xuất (không phải code đã tồn tại):**
- map metadata: width, height, district IDs/POI references, road subtype/visual metadata, entrance/anchor positions; tất cả có validator.
- optional weather: kind clear/cloudy/rain/fog, intensity 0–1, deterministic transition counters, weatherRngState; nếu authoritative phải lưu và clone qua engine.
- ambient events: type, anchor, startTick/duration/cooldown hoặc cosmetic lifetime, deterministic schedule; không ghi vào economic event feed nếu không có hệ quả.
- camera/settings: zoom/follow/mute/AFK là UI preference; không nằm trong canonical economic state trừ khi thật sự cần.

## 5. Phụ thuộc, milestone và trình tự làm việc

| Gate | Plan / kết quả giao | Phụ thuộc | Không được triển khai trước |
|---|---|---|---|
| G0 | Preflight: baseline CI, screenshot, test seeds, clock/save ADR, performance baseline | main HEAD | Mọi thay đổi lớn |
| G1 | [01 Visual & Camera](plans/01_VISUAL_DIRECTION_AND_CAMERA.md): **COMPLETE / OWNER-ACCEPTED 2026-10-16**, V01-A…E, PC FPS/soak deferred | G0 | 96 map mặc định |
| G2 | [02 World Map](plans/02_WORLD_MAP_EXPANSION.md): 96 new world, 3 districts, entrances, 20+ anchors, v5 migration | G1, G0 | Weather gameplay |
| G3 | [03 NPC Navigation](plans/03_NPC_AI_AND_NAVIGATION.md): weighted routing + readable routines, giữ goal/economy | G2 | Full weather response |
| G4 | [04 Day/Night & Weather](plans/04_DAY_NIGHT_AND_WEATHER.md): time visuals, clock ADR, 4-layer weather | G3 | Gameplay weather không có test |
| G5 | [05 Ambient & Audio](plans/05_AMBIENT_EVENTS_AND_AUDIO.md): deterministic scheduler + 3 event categories/5min | G4 | Large festivals |
| G6 | [06 Technical/Local/Performance](plans/06_TECHNICAL_LOCAL_AND_PERFORMANCE.md): save migration, profiling, optimize | Bắt đầu hỗ trợ từ G0; chốt sau G5 | Worker rewrite |
| G7 | [07 QA/Polish](plans/07_QA_BALANCING_AND_POLISH.md): matrix, soak, visual/observer gate | G1–G6 | Claim release-ready |

Plan 06 (kỹ thuật) **không chờ đến cuối mới bắt đầu**: preflight và save contract phải thực hiện trước G2, performance profile chạy ở từng gate. Plan 07 cũng chạy test ở mỗi PR, chỉ nghiệm thu tổng ở G7. Các estimate 1–2 tuần trong nghiên cứu chỉ là tham chiếu, không phải deadline.

**Thứ tự PR tối thiểu:** preflight/ADR → camera/visual slice → map/dimensions+migration → districts/content → weighted routing → routines → time/weather → ambient/audio → optimization → final QA. Mỗi PR phải nhỏ, dễ rollback; tránh một PR đổi map, clock, save, NPC cùng lúc.

## 6. Tiêu chí nghiệm thu cấp sản phẩm

| ID | Điều kiện PASS | Bằng chứng |
|---|---|---|
| AC-01 | 4–6 silhouette nhà rõ rệt; ground/road/foliage variation; chọn NPC vẫn rõ | screenshot cùng seed và viewport trước/sau |
| AC-02 | Pan/zoom/fit/reset/follow hoạt động; AFK không giật; bounds đúng 48 và 96 | Playwright camera + video/screenshot |
| AC-03 | New world 96×96 (9216 cells), 3 districts khác biệt, ≥20 POI/event anchors hợp lệ, ≥2 tuyến khả thi giữa hub | seed tests + connectivity assertions |
| AC-04 | NPC đi tới home/work/market/commons hợp lệ; không teleport; đường phụ/grass có thể được dùng; blocked fallback hữu hạn | deterministic path/goal tests + demo |
| AC-05 | Dawn/day/dusk/night phân biệt khi tắt HUD; đèn/âm thanh/hoạt động khớp canonical hour | 4 screenshot cùng seed/tick |
| AC-06 | Clear/cloudy/rain/fog; mưa tác động lighting + map + audio + NPC, fog có spatial treatment; tắt particles vẫn phân biệt | integration fixtures + before/after |
| AC-07 | Trong seed/fixture 5 phút có ≥3 **loại** micro-event; có diễn biến 20–30 phút | deterministic event log + capture |
| AC-08 | Seed + command sequence → cùng digest/replay; stock/currency/household/governance invariants không đổi | Vitest golden/replay + old suite |
| AC-09 | v5 save 48×48 load được không mất data; v6 96 save round-trip; invalid save không mutate live world | fixture + save tests |
| AC-10 | Test 25/50/100 NPC, stress 200 NPC nếu supported fixture; 1366×768, 1920×1080, ultrawide; target 60 FPS trên máy mục tiêu | CI + profile + hardware notes |
| AC-11 | Soak 60–120 phút, không path deadlock phổ biến, không memory growth không kiểm soát, không lỗi unhandled | log + memory/FPS samples |
| AC-12 | PC local offline sau khi cài dependencies; không bắt buộc backend/API/auth; mute và giảm chuyển động | local smoke + UI evidence |

**Chính sách PASS:** test tự động PASS là cần nhưng chưa đủ cho visual/performance. Nếu không có benchmark máy thật, ghi PARTIAL; không bịa 60 FPS. Nếu seed fixture chỉ pass nhờ forced event, ghi rõ fixture thay vì claim tất cả seed. Stress 200 NPC không bắt buộc mở lựa chọn 200 trong UI.

## 7. Bộ seed và test tối thiểu

**Fixture names đề xuất:** observer-default-20, observer-dense-50, observer-stress-100, observer-benchmark-200, observer-rain-shelter, observer-legacy-v5, observer-invalid-save. Mỗi fixture ghi seed số thực, population, mode, tick range, viewport, kỳ vọng trong file test/PR; tên không thay thế dữ liệu test.

**Lệnh gate hiện tại:**
~~~bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
~~~
Playwright Chromium phải được cài theo README; không báo pass nếu chưa chạy. Kiểm tra thêm deterministic replay, import v5, 96×96 path/entrances, pause/hidden-tab, FPS và 60–120 phút soak tùy gate.

**Definition of Done cho mỗi PR:** scope và non-goals rõ; docs/ADR cập nhật; code + tests pass; screenshot hoặc metrics phù hợp; migration/rollback được mô tả; PROGRESS ghi trạng thái thật; không xóa/skip test cũ để tạo xanh giả. PR không chứa code ngoài phạm vi.

## 8. Rủi ro và quyết định xử lý

| Rủi ro | Tín hiệu | Hành động |
|---|---|---|
| Phá determinism | digest lệch cùng seed | chặn merge, phân tách RNG, test replay |
| Save v5 hỏng | import thất bại hoặc ID/stock lệch | adapter v5 + golden fixture, không silent reset |
| Map lớn nhưng trống | camera overview chỉ thấy lặp/đất | ưu tiên density/variation, 3 district/anchors trước mở thêm |
| A* làm CPU tăng | path calls/tick, p95 tick tăng | cache hợp lệ, budgets, profile, không đổi routing khi chưa cần |
| Weather chỉ là particle | tắt particle không phân biệt state | 4-layer acceptance bắt buộc |
| Time quá nhanh/chậm | NPC bất động ở observer pace hoặc đèn nhấp nháy | ADR-01 experiment, không đổi default khi chưa pass |
| Visual quá nặng | frame drops khi zoom/100 NPC | static chunk/cache, culling, particle budgets |
| Agent tự mở rộng scope | thêm hệ kinh tế/LLM/engine mới | dùng contract + non-goals + PR nhỏ |

## 9. Mẫu lệnh giao ChatGPT Task (dùng lại cho từng plan)

> Bạn đang thực hiện **một task coding** cho repo giabao2605/Tiny-Civilization. Đọc README, docs/PROGRESS.md, docs/SIMULATION_CONTRACT.md, docs/observer-upgrade-2026/MASTER_PLAN.md và plan con [đường dẫn]. Kiểm tra code/HEAD thực tế; không giả định tính năng chưa có. Chỉ thực hiện **Task ID [ID]** được chỉ định trong plan, không làm task tiếp theo. Giữ 1 tick=1 giờ, deterministic seeded, save compatibility, economy/social/governance, legacy Phase 00–08; mọi thay đổi contract phải có ADR/test trước. Tạo branch mới từ main mới nhất; code + unit/E2E phù hợp; chạy npm ci/typecheck/lint/test/build/test:e2e nếu môi trường hỗ trợ. Ghi rõ test nào thực chạy, test nào không. Chụp screenshot/benchmark nếu liên quan. Cập nhật docs/PROGRESS.md/handoff, tạo PR và báo link, file đã sửa, test evidence, risk, next task. **Không tự merge PR code và không đánh dấu DONE khi gate chưa PASS.** Nếu thiếu quyền/môi trường, dừng ở báo cáo cụ thể, không tuyên bố đã làm.

**Khi giao task:** thay [đường dẫn], [ID] bằng một task duy nhất từ plan 01–07. Task mới phải tự đọc tài liệu trên main, không cần nhớ hội thoại này.

## 10. Tiêu chuẩn kết thúc workstream

Chỉ đánh dấu Observer Upgrade VERIFIED khi AC-01…AC-12 được ghi PASS hoặc ngoại lệ có lý do và được người sở hữu dự án duyệt; CI thực tế xanh, có smoke PC local, save migration được chứng minh, visual và observer watchability được xác nhận bằng bằng chứng. **Bản Master Plan này chỉ là tài liệu định hướng/contract thực thi, không chứng nhận tính năng đã triển khai.**

**Nguồn:** [Research source](RESEARCH_SOURCE.md) là phần tổng hợp Deep Research; các ADR, đường dẫn code, migration strategy, gate và task contract là quyết định kỹ thuật được bổ sung từ audit repository hiện tại.
