# Plan 03 — NPC AI & Navigation

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**NPC AI & Navigation:** A*, terrain cost, schedule, FSM/utility, social behavior, path recovery.

Thay fixed-route bằng grid pathfinding và destination system. **Cost model ban đầu đề xuất, cần tune bằng playtest**:

| Terrain | Cost gợi ý |
|---|---:|
| Main road | 1.0 |
| Side path | 1.1 |
| Plaza | 1.0 |
| Grass | 1.8–2.5 |
| Water / Building | Blocked |

NPC vẫn ưu tiên đường, nhưng có thể băng qua sân/công viên hoặc chọn đường phụ. Random walk thuần túy không đủ tạo cảm giác có cuộc sống. Mỗi NPC nên có home, role, POI ưa thích, speed, sociability và vài trait nhẹ.

State machine mẫu từ báo cáo: **Sleep → Home → Commute → Work/Errand → Eat → Wander → Social → Shelter → Return**. Hành vi cần **đọc được bằng mắt**: đi làm, về nhà, tụ tập, trú mưa. Không cần LLM, dialogue tree, quest hay combat để đạt mục tiêu quan sát.

## Điều kiện hoàn thành lấy từ nghiên cứu

- NPC **không còn bị khóa vào một lane/đường vàng**.
- Có destination/POI thực, schedule và route lựa chọn giữa district.
- NPC thường đi đường nhưng có thể chọn đường phụ hoặc grass khi hợp lý.
- Có cơ chế **path recovery** theo phạm vi plan con trong báo cáo.
- NPC thể hiện routine, pause, social behavior và shelter có nguyên nhân quan sát được.

**Ước lượng trong báo cáo:** 1–2 tuần.

**Phụ thuộc định hướng:** Cần cấu trúc world, POI, entrances và walkability từ Plan 02. Ưu tiên trước day/night/weather response.

## Nguồn

[Master Plan — Hệ thống gameplay và kỹ thuật đề xuất, Master Plan triển khai, Cấu trúc các plan con](../MASTER_PLAN.md).
