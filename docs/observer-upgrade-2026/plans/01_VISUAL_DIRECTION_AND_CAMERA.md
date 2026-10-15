# Plan 01 — Visual Direction & Camera

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**Visual Direction & Camera:** art bible, viewport, zoom/pan/follow, house kit, terrain variation, layering.

Chuyển presentation từ một mẫu nhà lặp lại và green tile đồng nhất sang **house kit với nhiều silhouette, mái, tường, cửa sổ, props**, terrain variation, edge/autotile, hoa, đất, cỏ dài/ngắn, decal. Dùng layering, shadow, foreground, smoke, light và water/foliage animation để thế giới có chiều sâu. Hướng art là **believable và coherent**, không phải photorealistic; ưu tiên variation rules hơn việc chỉ tăng số sprite.

**Camera modes được nêu trong báo cáo:**
- Manual: wheel zoom + drag/pan.
- Overview/Fit: một nút đưa camera về khung tổng thể.
- Follow: camera nhẹ nhàng bám một NPC hoặc vehicle.
- Cinematic/AFK: sau một khoảng không input, camera tự chuyển giữa các điểm thú vị.
- Reset: quay về zoom/position mặc định.

HUD nên thu nhỏ: đồng hồ, weather, speed và camera controls trong top bar mỏng; debug information (map size/FPS/NPC count) sau debug toggle. Zoom mặc định rộng hơn prototype nhưng NPC vẫn đọc được.

## Điều kiện hoàn thành lấy từ nghiên cứu

- House kit có **ít nhất 4–6 silhouette hoặc cấu hình dễ phân biệt**.
- Terrain có variation và edge; props/shadow/layering khiến mỗi khu vực có character riêng.
- Manual pan/zoom, overview/fit và follow/cinematic mode hoạt động.
- **Nhìn đẹp hơn rõ rệt ngay cả khi NPC chưa đổi**.
- Zoom mặc định rộng hơn prototype nhưng NPC vẫn đọc được.

**Ước lượng trong báo cáo:** Visual & Camera 1–2 tuần (developer đã quen codebase, chưa tính biến động lớn từ custom art).

**Phụ thuộc định hướng:** Camera + visual variation là ưu tiên đầu, trước world expansion và weather. Không mặc định rewrite sang 3D.

## Nguồn

[Master Plan — Chẩn đoán prototype, Cấu trúc world, Camera và view, Master Plan triển khai](../MASTER_PLAN.md).
