# Plan 02 — World / Map Expansion

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**World / Map Expansion:** 96×96, district, road hierarchy, POI, entrance, Tiled workflow.

Tăng từ **48×48 (2.304 tile) lên 96×96 (9.216 tile), gấp 4 lần diện tích logic**. Không nhảy ngay lên 256×256 vì nguy cơ map lớn nhưng trống.

| District | Thành phần theo báo cáo |
|---|---|
| Residential | Nhà ở, garden, laundry, well, alley, trẻ em/pet |
| Civic / Market | Plaza, stall, workshop, delivery, gathering, bell |
| Nature / Waterfront | Pond/river, bridge, trees, benches, birds, fishing-style ambient NPC |

Thay một loại đường vàng bằng **main road → side street → footpath → plaza**; grass có thể đi qua nhưng thường có cost cao hơn. Map cần nhiều route giữa các district, không phải các corridor duy nhất.

Workflow đề xuất trong báo cáo: **Tiled map → tile layers + object metadata → runtime world model → simulation → renderer**. Tách ground, decal, road, buildings, event markers và foreground. Object metadata gồm `buildingEntrance`, `spawnPoint`, `POI`, `districtBoundary`, `eventAnchor`, `weatherShelter`; render layer không sở hữu logic NPC.

## Điều kiện hoàn thành lấy từ nghiên cứu

- Map target **96×96**; ít nhất **3 district** khác biệt.
- Khoảng **20+ POI/event anchor** và đủ building entrance để NPC có destination thật.
- World lớn 4× diện tích logic nhưng **không bị trống**.
- Giữa các district chính có **nhiều route hợp lệ**.
- Road hierarchy và walkable grass tạo lối đi linh hoạt.

**Ước lượng trong báo cáo:** 1–2 tuần.

**Phụ thuộc định hướng:** Làm sau camera/visual variation để không chỉ phóng to prototype lặp lại.

## Nguồn

[Master Plan — Cấu trúc world, Hệ thống gameplay và kỹ thuật đề xuất, Master Plan triển khai](../MASTER_PLAN.md).
