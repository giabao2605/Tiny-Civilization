# Tiny Civilization

**Tiny Civilization** là game web pixel-art mô phỏng một ngôi làng tự vận hành. Người chơi là người quan sát: dân làng có nghề, nhu cầu, tiền, quan hệ và chịu hậu quả từ quyết định của chính họ. Câu chuyện xuất hiện từ quy luật mô phỏng, không phải các dòng sự kiện bịa sẵn.

**Trạng thái hiện tại: CHỈ MỚI LẬP KẾ HOẠCH, CHƯA CÓ GAME/CODE CHẠY ĐƯỢC.** Đây là repo dự án chính thức, kế hoạch đủ để bắt đầu code từng phần và kiểm thử nghiêm túc.

## Đọc tài liệu theo thứ tự

1. **[MASTER PLAN](docs/MASTER_PLAN.md)**: kế hoạch tổng, mục tiêu, thứ tự phase, giới hạn tính năng, cách đánh giá.
2. **[SIMULATION CONTRACT](docs/SIMULATION_CONTRACT.md)**: luật mô phỏng cốt lõi: thời gian, NPC, map, tài nguyên, định danh, save, seed và chống bug.
3. **Các plan nhỏ bên dưới**: task chi tiết từng phase, kịch bản test và điều kiện nghiệm thu.
4. **[PROGRESS](docs/PROGRESS.md)**: trạng thái thật sự đã làm tới đâu, test nào đã chạy, bug đang mắc.

## Lộ trình

| Phase | Nội dung | Plan chi tiết |
| --- | --- | --- |
| 00 | Khởi tạo dự án, chuẩn test | [Foundation](docs/phases/PHASE_00_FOUNDATION.md) |
| 01 | Bản đồ + 20 NPC có mục tiêu | [Living World](docs/phases/PHASE_01_LIVING_WORLD.md) |
| 02 | Đói, ngủ, tài nguyên, công việc | [Survival](docs/phases/PHASE_02_SURVIVAL.md) |
| 03 | 100 NPC, nhà cửa, tiền, giao dịch | [Economy](docs/phases/PHASE_03_ECONOMY.md) |
| 04 | Quan hệ xã hội, hộ gia đình | [Social](docs/phases/PHASE_04_SOCIAL.md) |
| 05 | Chính quyền và khủng hoảng | [Governance](docs/phases/PHASE_05_GOVERNANCE.md) |
| 06 | Save/load, hiệu năng, cân bằng | [Quality](docs/phases/PHASE_06_QUALITY.md) |
| 07 | Test cuối, triển khai game public | [Release](docs/phases/PHASE_07_RELEASE.md) |
| 08 | Nhiều làng, thương mại, chiến tranh (**sau MVP, tùy chọn**) | [Expansion](docs/phases/PHASE_08_EXPANSION.md) |

## Quyết định kỹ thuật

- **React + TypeScript + Vite** làm giao diện; **Phaser** vẽ bản đồ và nhân vật.
- **Simulation engine TypeScript độc lập**, không dùng AI API cho từng NPC.
- Khởi đầu **20 NPC**, tiến lên **100 NPC**, thế giới **48×48 ô**, một làng.
- **1 tick = 1 giờ trong game**, tua 1×/5×/20×; pause không cho thời gian game trôi.
- Có seed để tái hiện một thế giới; bản phát hành phải có lưu/tải game.
- Bản MVP **không** cần backend, cloud, tài khoản, multiplayer, Unreal/Unity hay đống framework phức tạp.

## Quy tắc làm việc

Đọc master + contract + phase hiện tại → code phần nhỏ chạy được → unit test → test trên trình duyệt → sửa lỗi → xác nhận checklist → cập nhật PROGRESS → commit. **Không được đánh dấu DONE nếu chỉ có code nhưng chưa test**, không xóa test cho xanh giả, không đụng tính năng phase sau nếu phase trước chưa đủ ổn.

Tài liệu chi tiết dùng thuật ngữ tiếng Anh để người viết code/AI agent triển khai chính xác; mỗi phase có tóm tắt tiếng Việt ở đầu. Khi có thay đổi thiết kế lớn, sửa master/contract trước rồi mới sửa code.

[Repository GitHub](https://github.com/giabao2605/Tiny-Civilization)
