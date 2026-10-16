# Plan 01 — Visual Direction & Camera | Implementation Specification v2

**Status:** **COMPLETE / OWNER-ACCEPTED** on 2026-10-16, V01-A…E implemented through PRs; code CI verified. **G1 advanced with explicit exceptions:** physical Windows FPS, 60–120 minute memory soak and subjective camera/occlusion review remain OPEN/DEFERRED, not PASS. **Next:** Plan 02 W02-A (geometry/schema audit + v5 fixture/ADR; no 96 generator in A).  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Simulation Contract](../../SIMULATION_CONTRACT.md).  
**Chủ đích:** Đẹp hơn ngay trên world 48×48 hiện tại, nâng camera thành công cụ quan sát; không đổi simulation.

## 1. Baseline đã kiểm tra

- **src/game/scenes/WorldScene.ts** đã có pointer drag pan, wheel zoom 1–3, click chọn NPC, camera bounds 48×48, tween chuyển động, paintTerrain/paintSite/paintCitizen bằng Phaser Graphics. **Không xây lại từ đầu.**
- **src/game/createGame.ts** đang tạo canvas 576×576 dựa GRID_WIDTH/HEIGHT và TILE_PIXELS=12; **src/game/GameCanvas.tsx** quản lý vòng đời Phaser; **src/app/App.tsx** và **src/styles/app.css** sở hữu HUD/layout.
- **src/sim/world.ts** có site kind home/work/commons/market, citizen.appearance. Không thêm art-only fields vào economic WorldState khi có thể derive từ seed/ID.
- Zoom hiện clamp 1–3; các giá trị zoom/fit cho viewport rộng cần đo thực tế, không chốt số tùy tiện.

## 2. Art bible tối thiểu (định hướng, chưa có asset thật)

| Lớp | Hướng thị giác | Quy tắc |
|---|---|---|
| Ground | cỏ 2–3 sắc, đất, hoa, bụi, viền nước/đường | variation hash(seed,x,y,layer), không Math.random trong render |
| Road | main road, side path, footpath, plaza | phân biệt texture/edge; visual road kind có thể tạm derive; logic routing chưa đổi |
| Buildings | ≥4–6 silhouette nhà, mái/cửa/sân khác nhau | silhouette dễ đọc ở zoom fit; anchor dưới/entrance không che NPC |
| Vegetation | ≥3 hình cây/bụi, bóng nhỏ, water ripple | giữ tile passability từ sim, không làm art thành obstacle ẩn |
| NPC | outfit/shape/idle/walk readable | giữ appearance và click hit target; không tự đổi job/goal |
| Lighting | shadow, emissive props chuẩn bị cho Plan 04 | chưa làm weather/time simulation ở Plan 01 |

**Art constraints:** pixel-art 2D top-down/three-quarter thống nhất; logical tile 12 px hiện tại là baseline, không tự tăng TILE_PIXELS làm vỡ layout. Nếu dùng sprite atlas, khai báo kích thước/anchor/scale/độ sắc nét và license rõ; asset tạo thủ công/procedural hợp lệ, không lấy sprite bản quyền từ game tham chiếu. Với nhiều texture, dùng palette/atlas variation để giảm chi phí; tránh mỗi tile một Graphics object.

## 3. Camera contract

**Các mode:** Manual (drag/wheel), Fit/Overview (toàn world), Reset (default camera), Follow NPC (theo citizenId đang sống), AFK/Cinematic (tự chọn điểm thú vị có cooldown). Ưu tiên **Manual/Fit/Reset/Follow** trước AFK.

- Zoom anchored-to-pointer nếu không gây nhảy; clamp tính từ world dimensions + viewport, tránh lộ khoảng trống ngoài map. Fit phải hoạt động trên 48×48 trước, 96×96 sau.
- Manual input hủy follow/AFK rõ ràng; click NPC không bị hiểu thành drag (threshold 5 px hiện có); follow NPC chết/không còn tồn tại phải thoát an toàn.
- Follow camera smoothing dùng Phaser camera/tween, **không đổi citizen.tile hoặc tick**. Pause giữ camera hoạt động, không làm NPC tiếp tục di chuyển gameplay.
- AFK chỉ tự chạy sau idle timeout **đề xuất 45–90 giây**, configurable; mặc định có thể OFF nếu gây chóng mặt. Không tự bật audio. Ưu tiên sự kiện đang diễn ra, tránh nhảy liên tục, hỗ trợ reduced motion.
- Responsive: canvas phải hiển thị đúng ở 1366×768, 1920×1080, ultrawide; pixel crisp, HUD không che trung tâm; resize không destroy world hoặc reset selection.
- Camera preferences thuộc UI/runtime settings, không làm đổi stateDigest hay save engine. Nếu persist settings, tách khỏi save canonical.

## 4. Task breakdown cho ChatGPT Task

### V01-A — Baseline & visual audit (không thêm feature)

**Đọc:** WorldScene.ts, createGame.ts, GameCanvas.tsx, App.tsx, app.css, current Playwright tests.  
**Làm:** xác định canvas resize/scale strategy; chụp 48×48 seed 12345 ở 1366×768 và 1920×1080; đo current zoom, drag, NPC click, scene restart; ghi số GameObjects/renderer draw calls nếu có thể. Viết art bible ngắn trong PR, có palette, scale, depth map.  
**Test/DoD:** baseline screenshots có thông tin seed/tick/viewport, không claim test nếu không chạy. Không sửa sim.

### V01-B — Responsive camera & controls

**Làm:** nâng createGame/WorldScene/GameCanvas để fit/zoom/pan/reset hoạt động với resize; expose camera actions qua interface rõ ràng thay vì React gọi thẳng private fields; thêm nút/shortcut với nhãn và tooltip trong HUD. Giữ pointer click chọn NPC.  
**Test:** Playwright wheel/drag/fit/reset/resize, không click nhầm sau drag, camera không nhìn ra ngoài map; pause và seed reset không làm camera crash; screenshot 3 viewport.  
**DoD:** mọi mode cơ bản dùng được trên map 48, không tăng số Phaser game instances sau remount.

### V01-C — Art kit, terrain/building/props

**Làm:** tách paintTerrain/paintSite thành lớp/layer hoặc helper renderer dễ kiểm thử; 4–6 nhà khác silhouette, terrain/road edges, 3 foliage variants, shadow/decal; dùng deterministic visual hash không đụng PRNG gameplay. Giữ site kind, position và gameplay click.  
**Test:** snapshot/render smoke cùng seed; thay art không đổi stateDigest sau N ticks; selected NPC dễ nhìn; so sánh screenshots before/after tại cùng seed/tick.  
**DoD:** ≥4 silhouette rõ ở zoom thông thường; không có props che lối đi hay click target; không memory leak khi reset.

### V01-D — Follow & cinematic AFK

**Làm:** follow selected citizen; soft camera pan; thoát khi drag/wheel/reset hoặc NPC chết; optional AFK director với deterministic visual priorities (plaza, market, selected NPC, event anchor nếu có). Tránh auto-focus nếu reduced-motion.  
**Test:** follow 2 NPC liên tiếp, reset seed, load save, NPC chết, manual override, idle timeout; E2E xác minh không đổi WorldState.  
**DoD:** không rung/teleport camera; AFK có thể tắt; không phá pause.

### V01-E — Visual/performance polish

**Làm:** kiểm tra overdraw, object pooling, cleanup scene listeners/tweens, layering khi NPC đi sau nhà/cây; kiểm tra screenshot ở zoom fit và close-up.  
**Test:** 20/50/100 NPC và 3 viewport, ghi FPS baseline vs after trên cùng môi trường; nếu thiếu máy thật ghi PARTIAL.  
**DoD:** không regression về chọn NPC, path animation, UI; perf không giảm vô lý.

## 5. Các file có khả năng sửa

**src/game/scenes/WorldScene.ts**, **src/game/createGame.ts**, **src/game/GameCanvas.tsx**, **src/app/App.tsx**, **src/styles/app.css**, có thể thêm **src/game/render/**, **src/game/camera/**, **public/assets/** và **tests/e2e/**. Đây là điểm bắt đầu audit, **không phải danh sách bắt buộc**. Không sửa engine.ts, economy.ts, governance.ts, social.ts cho plan này.

## 6. Nghiệm thu và bằng chứng

- **PASS:** V01-A…E có PR và test; camera Manual/Fit/Reset/Follow, optional AFK; 4–6 house silhouettes; terrain variation; click NPC, tween, pause và scene cleanup hoạt động; 3 viewport screenshots; 20/50/100 NPC smoke.
- **Không đủ PASS:** chỉ thay màu ground, chỉ thêm zoom CSS, ảnh đẹp nhưng hitbox sai, chỉ có screenshot không chạy tests, hay thay cả WorldState để phục vụ art.
- **Rollback:** art/camera code độc lập, có thể tắt AFK và revert renderer mà không migrate save.
- **Bàn giao:** commit/PR, danh sách asset + license, screenshot before/after, test commands/results, FPS profile, vấn đề tồn đọng và next task V01-?.

## G1 closure decision (2026-10-16)

Owner explicitly approved merging PR [#15](https://github.com/giabao2605/Tiny-Civilization/pull/15) and closing Plan 01 for roadmap sequencing. V01-E source [CI 38849296446](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38849296446) and follow-up documentation [CI 38858614357](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38858614357) both passed before closure. Automated tests, screenshots and camera features are delivered; the Plan 01 execution task series is **complete** by owner decision.

This does **not** change the historical measured performance results or falsely assert hardware validation. Baseline/final CI 54-case short samples showed mostly lower FPS on the later run; different runner/tick loads prevent causal attribution. Hardware FPS, manual visual evaluation, and a 60–120 minute soak remain explicitly deferred. Plan 06/07 must track them; W02-F must profile larger maps before Plan 03.

**Handoff:** W02-A is the next isolated task; check whether its prior preflight audit/fixture really exists rather than assuming it was implemented. Do not attempt W02-B or C without a verified dimension/save ADR and legacy fixture.

## 7. Prompt dùng trực tiếp cho ChatGPT Task

> Đọc docs/observer-upgrade-2026/MASTER_PLAN.md và plans/01_VISUAL_DIRECTION_AND_CAMERA.md cùng Simulation Contract/Progress. Thực hiện **chính xác task V01-[A/B/C/D/E]**, không làm các task còn lại. Audit code hiện tại trước khi sửa; WorldScene đã có zoom/pan, không rewrite. Không đổi simulation, seed, tick, save, economy/social/governance. Tạo branch từ main, implement + unit/E2E/screenshot theo task, chạy quality commands và ghi kết quả thực, cập nhật PROGRESS/handoff, mở PR; không tự merge PR code. Nếu phụ thuộc chưa xong, báo blocked cụ thể.

**Gate sang Plan 02:** camera/visual baseline pass; các thay đổi ở Plan 02 phải dùng lại camera API thay vì hardcode 48×48.
