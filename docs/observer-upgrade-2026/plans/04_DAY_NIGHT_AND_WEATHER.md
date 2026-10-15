# Plan 04 — Day/Night & Weather

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**Day/Night & Weather:** time state, lighting, weather state machine, wetness/fog/puddle, NPC reactions.

### Ngày đêm

- Ngày game mặc định khoảng **15 phút**, có thể cấu hình **10–30 phút**.
- Pause/1×/2×/4× là đề xuất trong nghiên cứu.
- Blend liên tục **dawn, daytime, golden hour, dusk, night**.
- Schedule NPC, street/window lights, chimney smoke, ambient sound và outdoor activity thay đổi theo thời gian.
- Không dùng một overlay màu làm toàn bộ hệ thống.

### Thời tiết

- Weather MVP: **Clear, Cloudy, Rain, Fog**; Storm để sau.
- State có intensity **0–1**, thời lượng tối thiểu và transition khoảng **30–90 giây**.
- Weather chỉ được coi là hoàn thành khi tác động **ít nhất 4 lớp: lighting + map + audio + NPC behavior**.
- Chuỗi mưa mẫu trong báo cáo: Clouds → ánh sáng tối/mềm → rain particles → ground wetness → road darkens → puddle → roof drip/water ripple → NPC lấy umbrella hoặc chạy tới shelter → outdoor activity giảm → rain ambience tăng → sau mưa puddle còn lại một lúc.
- Fog giảm contrast theo background/world distance; clear/cloudy đổi shadow intensity và foliage ambience.

## Điều kiện hoàn thành lấy từ nghiên cứu

- Không nhìn UI vẫn phân biệt được **dawn/day/dusk/night**.
- Nhận ra **rain/fog/cloud** ngay cả khi tắt particle, vì lighting/map/NPC/audio cũng thay đổi.
- Có phản ứng trú mưa của NPC và thay đổi cảnh quan (wet ground, puddle, lights, fog).
- Weather không chuyển tức thì thiếu transition.

**Ước lượng trong báo cáo:** Day/Night **4–7 ngày**; Weather & Map Response **1–2 tuần**.

**Phụ thuộc định hướng:** NPC routine/navigation cần sẵn sàng để phản ứng môi trường thực sự có ý nghĩa.

## Nguồn

[Master Plan — Hệ thống gameplay và kỹ thuật đề xuất, Master Plan triển khai](../MASTER_PLAN.md).
