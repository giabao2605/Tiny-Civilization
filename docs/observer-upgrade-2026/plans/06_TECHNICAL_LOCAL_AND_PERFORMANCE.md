# Plan 06 — Technical / Local Save / Performance

> **OBSERVER UPGRADE / NEW WORKSTREAM (2026-10).** Không phải Phase 00–08 cũ. **Status: PROPOSED**, chưa xác nhận đã triển khai. Đây là **bản bóc tách từ [báo cáo Deep Research](../MASTER_PLAN.md)**, không phải bản DOCX nguyên văn. Xem [phân biệt roadmap](../README.md).

## Phạm vi theo báo cáo

**Technical / Local Save / Performance:** simulation-render separation, local save, culling/chunking, profiling.

**Foundation**: audit codebase hiện tại, kiểm tra separation giữa simulation/render, seed, debug metrics (FPS/sim tick), state model và save seed. Báo cáo không khuyến nghị rewrite engine mặc định. Với stack Phaser/web hoặc tương tự, tận dụng Tilemap/layer/object metadata; logic NPC không nằm trong render layer.

**Runtime:** simulation tick cố định khoảng **5–10 Hz** trong khi render theo frame. NPC offscreen có thể cập nhật thưa hơn; dùng spatial partition/chunk để tránh scan toàn map mỗi tick. Chỉ cân nhắc Web Worker khi profiling cho thấy JavaScript simulation block UI. Performance & polish gồm culling, pooling, save/load, soak test và bug pass.

**PC local-first:** không backend, không auth, không API bắt buộc, không phụ thuộc deploy. Save local đề xuất gồm `worldSeed`, `gameTime`, `weather state/intensity`, core NPC state, map mutations và settings. Seed cố định hỗ trợ tái hiện lỗi.

## Điều kiện hoàn thành lấy từ nghiên cứu

- Có **FPS/sim tick metrics**, state model rõ và save seed.
- Simulation tách renderer; không rewrite engine chỉ vì nâng presentation.
- Culling/chunking/pooling dựa trên profiling, không tối ưu mù.
- Local save/load hỗ trợ world/time/weather/NPC/map mutations/settings.
- Chạy local lâu ổn định, không path deadlock phổ biến.

**Ước lượng trong báo cáo:** Foundation **2–4 ngày**; Performance & Polish khoảng **1 tuần**. Đây là các mốc thuộc roadmap tổng thể, không phải ước lượng gộp chính thức của riêng workstream.

## Nguồn

[Master Plan — Hệ thống gameplay và kỹ thuật đề xuất, Master Plan triển khai](../MASTER_PLAN.md).
