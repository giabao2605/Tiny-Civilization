# Plan 05 — Ambient Events & Audio

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**Ambient Events & Audio:** event scheduler, cart/birds/pets/market, ambience buses, positional SFX.

Micro-event scheduler phụ thuộc **district + time + weather**. Event không cần quest và có **cooldown + budget** để world sống nhưng không hỗn loạn.

Các event được nêu trong nghiên cứu:

- cart/delivery đi qua main road;
- stall mở buổi sáng, đóng buổi tối;
- hai NPC đứng nói chuyện rồi tách ra;
- nhóm nhỏ tụ ở plaza;
- chim đáp xuống rồi bay đi;
- chó/mèo đi dạo;
- trẻ chạy về nhà lúc trời mưa;
- NPC đứng trú dưới mái hiên;
- chuông vang theo giờ;
- chimney smoke mạnh hơn sáng/tối;
- lights bật dần vào dusk;
- chim tắm trong puddle sau mưa.

Audio đề xuất: **day/night/rain ambience, one-shots**, sau MVP mới cân nhắc district-specific soundscape. Chú trọng cảm giác thư giãn và các khoảnh khắc nhỏ đáng nhìn.

## Điều kiện hoàn thành lấy từ nghiên cứu

- Trong khoảng **30 giây** có ít nhất một thứ nhỏ đáng quan sát.
- Trong **5 phút** world đổi trạng thái, và ở seed test có **ít nhất 3 category micro-event khác nhau**.
- Trong **20–30 phút** các hệ thống có thể giao nhau thành một câu chuyện nhỏ không cần dialogue.
- Event scheduler có cooldown và budget, tránh hỗn loạn.

**Ước lượng trong báo cáo:** Ambient Content khoảng **1 tuần**.

**Phụ thuộc định hướng:** Event cần world/district, NPC routine, time và weather; không biến thành quest/click-to-interact bắt buộc.

## Nguồn

[Master Plan — Hướng sản phẩm nên chốt, Hệ thống gameplay và kỹ thuật đề xuất, Master Plan triển khai](../MASTER_PLAN.md).
