# Plan 07 — QA / Balancing / Polish

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**QA / Balancing / Polish:** seed test matrix, NPC counts, viewport matrix, save transition tests, soak tests.

### Ma trận kiểm thử theo báo cáo

- NPC count: **25 / 50 / 100 / 200**.
- Viewport: **1366×768**, **1920×1080**, **ultrawide**.
- Render performance: target thiết kế **60 FPS** trên máy dev mục tiêu; cần điều chỉnh sau profiling, không coi là số đã đạt.
- Soak test: **60–120 phút** trước khi tăng scope.
- Kiểm tra local save/load, transition state, world seed và path deadlock.
- Kiểm tra game có thể chạy **chỉ để quan sát**, không cần click NPC hay điều khiển.

### Acceptance criteria cấp sản phẩm

- **Navigation:** NPC thường đi đường nhưng không bị khóa vào một đường vàng; có nhiều route giữa district.
- **Visual:** ít nhất 4–6 house silhouette/configuration; terrain edge/variation; props/shadow/layering.
- **World:** 96×96, ít nhất 3 district, khoảng 20+ POI/event anchor và entrance thực.
- **Camera:** pan/zoom/fit/follow/cinematic hoạt động; zoom rộng mà NPC vẫn đọc được.
- **Time:** không nhìn UI vẫn phân biệt được dawn/day/dusk/night.
- **Weather:** phân biệt rain/fog/cloud khi tắt particle nhờ lighting/map/NPC/audio.
- **Watchability:** seed test 5 phút có ít nhất 3 category micro-event.
- **Stability:** local run lâu ổn định, không path deadlock phổ biến.

### Gate chống phình scope

Chưa thêm **seasons, festival lớn, economy, construction growth hoặc relationship system** mới cho đến khi vòng lặp “chỉ nhìn vẫn thú vị” đạt yêu cầu. Báo cáo cũng đề xuất không ưu tiên quest, dialogue, combat hay click-to-interact.

**Ước lượng trong báo cáo:** Performance & Polish khoảng **1 tuần** (không phải cam kết).

## Nguồn

[Master Plan — Hướng sản phẩm nên chốt, Master Plan triển khai, Cấu trúc các plan con](../MASTER_PLAN.md).
