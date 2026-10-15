# Living Settlement — Observer Upgrade 2026

**Bộ kế hoạch triển khai mới, độc lập với Phase 00–08.** Tài liệu đã được viết lại dựa trên báo cáo Deep Research và audit codebase main ngày 2026-10-15. **Trạng thái tài liệu: READY FOR TASKING. Trạng thái tính năng: CHƯA TRIỂN KHAI.**

## Phân biệt roadmap

| Chuỗi | Đường dẫn | Mục đích |
|---|---|---|
| Legacy MVP Phase 00–08 | [docs/MASTER_PLAN.md](../MASTER_PLAN.md), [docs/phases](../phases/), [Simulation Contract](../SIMULATION_CONTRACT.md) | Luật mô phỏng/tiến độ hiện hành, giữ nguyên |
| Observer Upgrade 2026 | **Thư mục này** | Nâng hình ảnh, camera, 96×96, NPC navigation, thời tiết, ambient, PC local |
| Nguồn nghiên cứu | [RESEARCH_SOURCE.md](RESEARCH_SOURCE.md) | Bản báo cáo Deep Research đã lưu trước khi viết lại, không phải DOCX gốc |

**Quy tắc:** không gọi bộ Observer Upgrade là Phase 09, không đánh dấu legacy Phase DONE thay cho feature mới, không rewrite economy/social/governance. Mọi thay đổi simulation contract cần ADR/test và PR code riêng.

## Tài liệu triển khai

| Thứ tự | Tài liệu | Task IDs |
|---|---|---|
| 00 | [MASTER IMPLEMENTATION PLAN v2](MASTER_PLAN.md) | G0–G7, ADR, AC-01…AC-12 |
| 01 | [Visual Direction & Camera](plans/01_VISUAL_DIRECTION_AND_CAMERA.md) | V01-A…E |
| 02 | [World / Map Expansion](plans/02_WORLD_MAP_EXPANSION.md) | W02-A…F |
| 03 | [NPC AI & Navigation](plans/03_NPC_AI_AND_NAVIGATION.md) | N03-A…F |
| 04 | [Day/Night & Weather](plans/04_DAY_NIGHT_AND_WEATHER.md) | E04-A…F |
| 05 | [Ambient Events & Audio](plans/05_AMBIENT_EVENTS_AND_AUDIO.md) | A05-A…E |
| 06 | [Technical / Local Save / Performance](plans/06_TECHNICAL_LOCAL_AND_PERFORMANCE.md) | T06-A…F (cross-cutting từ G0) |
| 07 | [QA / Balancing / Polish](plans/07_QA_BALANCING_AND_POLISH.md) | Q07-A…F (test xuyên suốt) |

**Bắt đầu đúng thứ tự:** G0/T06-A + W02-A (chỉ audit geometry/save, không code migration) → V01-A → V01-B → V01-C → V01-D/E → W02-B…F → N03-A…F → E04-A…F → A05-A…E → T06 final → Q07 final. Plan 06 và 07 hỗ trợ các plan khác từ sớm. Chỉ chạy task sau khi phụ thuộc đã merge/verified.

## Giao một ChatGPT Task mới như thế nào?

**Mỗi lần giao một task ID**, ví dụ V01-A. Task mới không cần nhớ hội thoại trước vì toàn bộ contract nằm trong repo main.

~~~text
Repository: giabao2605/Tiny-Civilization.
Bạn là coding agent phụ trách Observer Upgrade 2026.
Đọc README.md, docs/PROGRESS.md, docs/SIMULATION_CONTRACT.md,
docs/observer-upgrade-2026/MASTER_PLAN.md và
docs/observer-upgrade-2026/plans/01_VISUAL_DIRECTION_AND_CAMERA.md.

Chỉ làm task V01-A, theo đúng Scope/DoD/Test của plan.
Trước khi code, kiểm tra main HEAD và module thật. Không giả định code
chưa có camera/NPC/save; giữ 1 tick=1 giờ, seeded determinism,
save v5, kinh tế/xã hội/chính quyền. Không làm các task khác.

Tạo branch từ main mới nhất, thực hiện task và tests phù hợp,
chạy npm ci, typecheck, lint, test, build, test:e2e nếu môi trường cho phép.
Ghi rõ cái nào PASS/FAIL/NOT RUN, seed/viewport/screenshot/metrics.
Cập nhật PROGRESS/handoff và mở PR code riêng.
KHÔNG tự merge PR code, không đánh dấu DONE nếu thiếu bằng chứng.
Báo link PR, files changed, test evidence, risk và next task.
~~~

Đổi đường dẫn plan và task ID theo bảng trên. Nếu giao task A05-C trước khi E04/A05-A,B hoàn thành, agent phải báo BLOCKED thay vì tự code cả thế giới.

## Quyết định kỹ thuật đã khóa

- Canonical simulation: **1 tick = 1 game-hour**, 1×/5×/20× giữ nguyên; 15min/day là experiment Observer Pace có ADR riêng.
- Map **96×96 cho new worlds**, legacy save v5 **48×48 giữ nguyên**, migration versioned và test.
- Camera zoom/pan, NPC goals, save/load, economy/social/governance **đã có** trong code, chỉ nâng cấp phần thiếu.
- Weather có **4 lớp** lighting + map + audio + NPC; ambient cosmetic không tự thay tiền/quan hệ.
- PC local-first, không backend/API/auth, không rewrite Phaser.
- 60 FPS là target cần benchmark trên máy thật, không tự tuyên bố đã đạt.

## Quy trình merge code sau này

Task branch → PR nhỏ → CI và test evidence → review invariants/ADR → merge → cập nhật PROGRESS → task tiếp. Nếu PR code không pass, giữ mở; không bỏ test để merge. Bộ tài liệu này có thể merge riêng vì **chỉ sửa docs**, không thay code hay schema.

## Nguồn gốc và giới hạn

[RESEARCH_SOURCE.md](RESEARCH_SOURCE.md) giữ nội dung báo cáo Markdown Deep Research đã có. Các file DOCX gốc từng được Deep Research liệt kê nhưng không tải/truy xuất được, nên **không có tuyên bố 1:1 với DOCX**. MASTER_PLAN v2 và bảy plan con là **tài liệu kỹ thuật mới do trợ lý biên soạn**, bổ sung từ audit codebase thực tế; các số đo/ADR mới được ghi là quyết định hoặc mục tiêu, không mạo nhận là kết quả nghiên cứu đã kiểm chứng. Link sandbox và trích dẫn cũ trong Research Source chỉ để lưu nguồn lịch sử, có thể không còn hoạt động.

## V01-A — Baseline & Visual Audit (2026-10-15)

Implementation/status artifacts are kept separately from legacy Phase 00–08 documents:

- [V01-A source audit and evidence protocol](V01_A_AUDIT.md)
- [Visual Direction / Art Bible](ART_BIBLE.md)
- [V01-A status, test attribution and open gates](V01_A_STATUS.md)
- [V01-B camera implementation handoff](V01_B_HANDOFF.md)

**V01-A is PARTIAL until the PR CI screenshot artifact is verified and visually reviewed.** Documentation and a baseline Playwright capture test do not implement or certify any camera/art features. See status file before starting V01-B.
