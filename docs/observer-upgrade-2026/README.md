# Living Settlement — Observer Upgrade (Deep Research, 2026-10)

> **BỘ KẾ HOẠCH MỚI / NEW WORKSTREAM.** Không phải các Phase 00–08 trước đây.

## Phân biệt hai chuỗi kế hoạch

| Chuỗi | Vị trí | Vai trò |
| --- | --- | --- |
| **Legacy MVP / Phase 00–08** | [`docs/MASTER_PLAN.md`](../MASTER_PLAN.md), [`docs/phases/`](../phases/) | Kế hoạch và tiến độ đã/đang triển khai của prototype 48×48, browser-first. **Giữ nguyên**. |
| **Observer Upgrade / Living Settlement** | **Thư mục này** | Nghiên cứu và đề xuất giai đoạn tiếp theo: đẹp hơn, bản đồ 96×96, camera, NPC đi tự nhiên, ngày đêm, thời tiết, ambient events, PC local-first. |

**Quy tắc thực thi:** Không đánh dấu bất kỳ mục nào ở đây là đã code/xong chỉ vì tài liệu tồn tại. Không diễn giải các plan mới thành Phase 09 của roadmap cũ, không ghi đè `docs/MASTER_PLAN.md`, `docs/PROGRESS.md` hay `docs/phases/`. Trước khi thực thi cần audit trạng thái repo, đối chiếu những hệ thống hiện có và xác định scope thay đổi. Roadmap cũ vẫn là nguồn sự thật về tiến độ đã thực hiện.

## Tài liệu

- [MASTER_PLAN.md](MASTER_PLAN.md) — nội dung nghiên cứu và roadmap tổng thể, chuyển từ báo cáo Deep Research Markdown do người dùng cung cấp.
- [plans/01_VISUAL_DIRECTION_AND_CAMERA.md](plans/01_VISUAL_DIRECTION_AND_CAMERA.md)
- [plans/02_WORLD_MAP_EXPANSION.md](plans/02_WORLD_MAP_EXPANSION.md)
- [plans/03_NPC_AI_AND_NAVIGATION.md](plans/03_NPC_AI_AND_NAVIGATION.md)
- [plans/04_DAY_NIGHT_AND_WEATHER.md](plans/04_DAY_NIGHT_AND_WEATHER.md)
- [plans/05_AMBIENT_EVENTS_AND_AUDIO.md](plans/05_AMBIENT_EVENTS_AND_AUDIO.md)
- [plans/06_TECHNICAL_LOCAL_AND_PERFORMANCE.md](plans/06_TECHNICAL_LOCAL_AND_PERFORMANCE.md)
- [plans/07_QA_BALANCING_AND_POLISH.md](plans/07_QA_BALANCING_AND_POLISH.md)

## Nguồn gốc và giới hạn

Nguồn khả dụng trong phiên GitHub này là **`deep-research-report.md` do người dùng cung cấp**, chứa báo cáo tổng thể và tên/bản tóm tắt của 7 plan con. Báo cáo trỏ đến 8 file DOCX và ZIP trong vùng `sandbox:/mnt/data/` của phiên Deep Research khác; các file DOCX/ZIP đó **chưa được chuyển vào repository và không có nội dung gốc để đối chiếu 1:1 trong phiên này**.

Vì vậy, `MASTER_PLAN.md` ghi lại báo cáo nghiên cứu khả dụng, còn 7 tài liệu dưới `plans/` là **bản bóc tách từ nội dung báo cáo**, **không được tự nhận là bản sao nguyên văn 7 DOCX**. Khi có ZIP hoặc DOCX gốc, hãy nhập đúng bản gốc vào thư mục này và đối chiếu trước khi gọi bộ tài liệu là đầy đủ.

**Tình trạng:** Documentation import / proposed plan; chưa triển khai hoặc nghiệm thu các tính năng mới.

**Thứ tự ưu tiên theo báo cáo:** Camera + visual variation → map structure → NPC navigation/routine → day/night → weather response → ambient events → performance/polish.
