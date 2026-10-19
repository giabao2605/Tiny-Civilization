# Tiny Civilization

**Tiny Civilization** là game web pixel-art mô phỏng một ngôi làng tự vận hành. Người chơi là người quan sát: dân làng có nghề, nhu cầu, tiền, quan hệ và chịu hậu quả từ quyết định của chính họ. Câu chuyện xuất hiện từ quy luật mô phỏng, không phải các dòng sự kiện bịa sẵn.

**Trạng thái (15/10/2026):** Phase 00–05 đã merge. Phase 06 merge qua [PR #7](https://github.com/giabao2605/Tiny-Civilization/pull/7), [CI main PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38673629622); một số gate về người chơi mới và hiệu năng thiết bị vật lý vẫn mở. Phase 07 đang chuẩn bị phát hành trên `feat/phase-07-release`, **chưa merge/chưa xác nhận URL public**. Xem [PROGRESS](docs/PROGRESS.md) cho trạng thái thật.

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

## Chạy Tiny Civilization MVP release candidate 0.9.0

Yêu cầu Node.js **22.12+ (major 22)** và npm **10**; dùng phiên bản trong `.nvmrc`. Sau khi checkout branch triển khai và khi đã có `package-lock.json` được commit:

```bash
npm ci
npm run dev
```

Mở URL Vite in ra trong terminal (thường là `http://localhost:5173`). Nhấn cư dân trên bản đồ hoặc trong danh sách để mở inspector; **Tạm dừng / Tiếp tục**, **1× / 5× / 20×**, ô **Seed** và **Tạo lại** điều khiển simulation thật. Cuộn chuột để zoom, kéo để pan; nút **Khởi tạo lại canvas** kiểm tra vòng đời Phaser. Phase 03 có lựa chọn 20/50/100 NPC và các giao dịch food/wood qua một chợ chung. Để xem, chọn dân số rồi nhấn **Tạo lại**.

### Kiểm tra kỹ thuật

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright tự khởi động Vite tại port 4173 và kiểm tra Chromium desktop/mobile. Nếu thiếu thư viện hệ điều hành cần thiết cho Chromium, thử `npx playwright install --with-deps chromium` (Linux). Xem kết quả CI và screenshot trong artifact GitHub Actions.

### Cấu trúc chính

- `src/app`: React HUD/inspector và `livingCoordinator.ts`, đầu mối duy nhất giữ `WorldState` và quản lý timer.
- `src/game`: Phaser đọc snapshot, vẽ tile/nhà/NPC, nội suy và xử lý click/pan/zoom; không quyết định luật game.
- `src/sim`: PRNG xorshift32, `createWorld(seed)`, BFS, `advanceOneTick` và runtime accumulator clock độc lập React/Phaser.
- `tests/e2e`: Chromium desktop/mobile, sự kiện, chọn NPC, tốc độ, pause và lifecycle.
- `.github/workflows/ci.yml`: xác minh từ checkout sạch và lưu screenshot artifact.

**Lưu/tải hiện hoạt động bằng localStorage và import/export JSON cục bộ**, snapshot engine `sim-v5-phase06`. Không có backend, tài khoản, đồng bộ đám mây hoặc AI API. Save trên trình duyệt có thể mất khi người chơi xóa dữ liệu trang; file JSON là phương án backup. Bấm **Tạo lại** sẽ yêu cầu xác nhận, nhưng không tự xóa bản lưu cũ. Lưu tiếp sẽ ghi đè slot localStorage hiện tại.

## Phase 07 · Phát hành website (đang thực hiện)

**Phiên bản ứng dụng:** `0.9.0`, release candidate, chưa tạo tag chính thức. **Engine/save schema:** `sim-v5-phase06` / format 1. **Trình duyệt ưu tiên:** Chromium desktop; mobile responsive ở mức kiểm thử viewport, **chưa chứng nhận trên thiết bị thật**.

**URL GitHub Pages dự kiến:** `https://giabao2605.github.io/Tiny-Civilization/`. Đây chỉ là địa chỉ quy ước, **không được coi là URL đang hoạt động trước khi có xác minh public**. Workflow triển khai `.github/workflows/pages.yml` chạy sau khi test từ `main` hoặc branch Phase 07; bật Settings → Pages → Build and deployment → Source: **GitHub Actions** nếu chưa bật. Nếu Pages chưa cấu hình, deploy có thể bị chặn, dù code và CI hợp lệ. Xem [hướng dẫn bàn giao](docs/RELEASE_NOTES_0.9.0.md).

**Cách chơi:** Mở trang, quan sát làng 48×48, chọn một NPC trên bản đồ/danh sách để xem lý do hành động; 1 tick = 1 giờ game; 1× = 2 tick/giây thực, 5× = 10 và 20× = 40 tick/giây mục tiêu trước giới hạn máy. Pause dừng thời gian mô phỏng; Seed + số dân 20/50/100 tạo thế giới tái lập được theo cùng engine và trình tự lệnh. Các sự kiện về đói, giao dịch, quan hệ và khủng hoảng có nguyên nhân trong mô phỏng. Ở 100 NPC và 20× có thể giật trong Chromium CI; đừng mặc định mọi máy đạt 60 FPS.

**Lệnh kiểm thử:**

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright install chromium
npm run test:e2e

# Linux/macOS CI: build và smoke chính xác base path của project GitHub Pages
GITHUB_PAGES=true npm run build
PLAYWRIGHT_PRODUCTION=true npm run test:e2e -- tests/e2e/release.spec.ts
```

Thay `npm run dev` bằng `npm run preview` để xem bản build (nếu đã build với `GITHUB_PAGES=true`, truy cập `/Tiny-Civilization/`). `PLAYWRIGHT_PRODUCTION` sử dụng Vite preview ở cổng 4173, không dùng dev server. **CI sau commit cuối, benchmark và website public phải kiểm chứng thực tế** trước khi thay trạng thái phát hành sang DONE.

**Giới hạn MVP:** một làng, không có trồng/chăn nuôi nâng cao, mở rộng nhiều làng hay chiến tranh; không cloud save, không multiplayer, không account, không AI API. Công trình, mua bán, hộ gia đình, dịch bệnh và lãnh đạo tuân theo cơ chế mô phỏng hữu hạn. Phản hồi lỗi tại [GitHub Issues](https://github.com/giabao2605/Tiny-Civilization/issues) (kèm seed, tick, trình duyệt, bước tái hiện).

## Phase 03 Economy (merged)

- Phase 03 đã merge. Branch lịch sử: feat/phase-03-economy. PR #4: https://github.com/giabao2605/Tiny-Civilization/pull/4
- Dân số deterministic: 20, 50 hoặc 100 trên cùng bản đồ 48×48; nhà có capacity 4, người dư ra có trạng thái vô gia cư.
- NPC sở hữu ví, food/wood trong túi và nghề nghiệp. Một chợ có kho hàng và ngân quỹ hữu hạn. Người sản xuất phải mang hàng đến chợ để bán, nhận tiền thật, và chỉ mua được khi đủ tiền.
- Thu hoạch tài nguyên hữu hạn; xây nhà tiêu 8 wood một lần ngay lúc khởi công. Thợ xây cần đến nơi, làm đủ 8 giờ và được trả tiền từ quỹ chợ thật.
- Inspector hiển thị wallet, túi đồ, nhà, nghề, quyết định và giao dịch; dashboard hiển thị dân số, tình trạng nhà, cung-cầu, hàng hóa, tiền và xây dựng.
- Phase 03 đã PASS 10 seed × 720 tick cho cả ba mức dân số và 42 unit / 4 Chromium E2E tests, chi tiết trong PROGRESS; đã merge; chưa có hệ thống social, save/load hoàn chỉnh, backend hoặc release.

Để kiểm chứng, dùng npm ci, npm run typecheck, npm run lint, npm run test, npm run build và npm run test:e2e. Kết quả thực tế được ghi trong docs/PROGRESS.md và GitHub Actions của PR #4, không suy luận từ source code.

## Phase 04 Social (DONE, merged via PR #5)

- Engine schema v4: graph quan hệ thưa có hướng, hạn mức cạnh/cooldown, tương tác tại quảng trường/nơi làm thật, mâu thuẫn khi nguồn tài nguyên vừa cạn; seed quyết định kết quả.
- Hộ gia đình ban đầu có 1 người, người trưởng thành ghép đôi sau nhiều lần tiếp xúc và có chỗ ở. Tuổi tăng 1 giờ mỗi tick; trẻ phụ thuộc không đi làm, được người cùng hộ cho ăn bằng food thật.
- Sinh con có thời gian chờ, cooldown, yêu cầu nhà/food/tuổi/sức khỏe và soft cap 100 / hard cap 120. Người chết được dọn liên kết household/partner; tiền/hàng vẫn thuộc túi người chết để bảo toàn nguồn lực.
- Inspector có liên kết quan hệ, hộ, partner, memorial; timeline lọc Social/Economy/Survival. [CI 38520465893](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38520465893) xác nhận typecheck, lint, unit/stress/build, Chromium E2E 5/5 PASS; Node benchmark 20/100 NPC cùng hệ thống bảo toàn tiền/food/wood. Xem docs/PROGRESS.md để biết benchmark, seed và các giới hạn. Đã merge vào `main` qua PR #5 ngày 2026-10-14; Phase 05 đã được hoàn tất và merge qua PR #6.


## Phase 05 Governance (DONE, merged via PR #6)

- Branch `feat/phase-05-governance` thêm `WorldState` schema v5; chọn trưởng làng bằng điểm ủng hộ từ quan hệ xã hội, sức khỏe, tài sản/việc làm và tie-break ID ổn định. Nhiệm kỳ 30 ngày game, xử lý chết/khuyết chức.
- Chính sách **cứu trợ food khẩn cấp** chuyển tối đa 6 food thực có từ kho thuộc chợ sang túi của tối đa 6 người thiếu ăn; không cấp thêm tiền/hàng. Có xác thực trưởng làng, thời điểm lệnh, thời gian hiệu lực/cooldown và lý do từ chối.
- Hai biến cố theo cùng tick: **mất mùa** giảm yield/regen trên tối đa ba ruộng thật; **bệnh cục bộ** giảm giờ lao động/HP của tối đa sáu người thật, hết bệnh không tự đầy máu.
- UI **Village Governance** hiển thị trưởng làng có thể nhấn để inspect, luật cứu trợ, số lượng thực đã chuyển, biến cố hiện hành, số đo sản xuất/HP, các bản ghi timeline có nguyên nhân. Phần mô phỏng không có clock riêng, AI API hay kho ngân sách thứ hai.
- Kiểm chứng: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`. Bằng chứng chính thức: [CI PASS 74/74 unit, 8/8 Chromium E2E](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563), [ảnh kiểm thử](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38533542563/artifacts/11879336547) và [PROGRESS](docs/PROGRESS.md).


## Phase 06 Quality (đã merge, quality gate còn PARTIAL)

- [PR #7](https://github.com/giabao2605/Tiny-Civilization/pull/7) đã merge vào `main` tại `efa9fa23f44f22b63c4531c2c0df96d9a5a0c37c`; [CI sau merge PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38673629622). Trạng thái **PARTIAL về nghiệm thu chất lượng**, vì chưa playtest người mới hoặc kiểm chứng FPS trên thiết bị vật lý. Merge không đồng nghĩa hoàn thành mọi gate.
- Mô phỏng vẫn dùng **một** `WorldState` schema v5. Snapshot versioned `sim-v5-phase06` lưu cả RNG state, ID counters, giao dịch, quan hệ/hộ, governance, biến cố, event history và lệnh chính sách đang xếp hàng. Không lưu Phaser/React hoặc real timers.
- **Lưu thế giới** ghi snapshot vào localStorage của trình duyệt hiện tại; **Tải bản lưu** xác thực toàn bộ dữ liệu trước khi đổi world và tự pause; **Xuất JSON / Nhập JSON** dùng để sao lưu, chuyển thiết bị. Lỗi quota, JSON hỏng, phiên bản lạ hay ID vô hiệu được hiển thị mà không xóa thế giới đang chạy.
- Mỗi file JSON tối đa **8 MiB**, chỉ hỗ trợ engine/schema hiện hành; không có migration cho bản save phiên bản trước. localStorage có thể bị xóa bởi trình duyệt, hãy giữ file JSON nếu thế giới quan trọng.
- Kế hoạch kiểm chứng: replay 1.000 ticks vs 500 + save/load + 500 ở 20/50/100 NPC × nhiều seed, 10 seed × 30 ngày cả bình thường và thiếu dự trữ, benchmark Node tick p50/p95 và Chromium save/reload/import/error/mobile/hidden-tab.
- **Kiểm chứng Chromium và unit:** [Actions #38671225735 PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38671225735) tại commit `f5e886a`: 84/84 Vitest, 11/11 Chromium E2E, audit/typecheck/lint/build PASS. Screenshots: [artifact 11943838565](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38671225735/artifacts/11943838565).
- **Số đo browser CI (Chromium headless, 100 NPC, 20×, 45 frame):** trung bình **25 FPS**, p95 frame **83.3 ms**, một mẫu JS heap **81.4 MB**. Có giật hình; **không tuyên bố 60 FPS**. Node tick p95 100 NPC trên lượt chạy này chưa trích xuất; lượt trước cùng code lõi là 8.841 ms/tick. Các phép đo phụ thuộc máy runner; chưa kiểm tra trên điện thoại vật lý.
- **10 seed × 30 ngày ở 100 NPC:** kịch bản thường bảo toàn 100 dân, không thiếu food ở mốc lấy mẫu; kịch bản famine cố ý cắt toàn bộ food và tái sinh ruộng khiến cả 100 NPC chết trong 30 ngày nhưng không âm tài sản, không tạo hàng vô hạn. Không coi thử nghiệm cực đoan là cân bằng mặc định.
- **Chưa phát hành Phase 07.** Playtest với người mới chưa thực hiện; xem [PROGRESS](docs/PROGRESS.md) để biết gate còn mở và phân biệt số đo Node / browser / thiết bị vật lý.

## Development checks: fast by default, browser manually

Pull requests and pushes to main execute all unit/integration/720-hour deterministic checks plus typecheck, lint, dependency audit and production build, **without Chromium**. To run Chromium E2E and production smoke, dispatch **Tiny Civilization Full E2E (manual)** from GitHub Actions on the intended ref. GitHub Pages deploy is also manual-only because local PC play is the primary target. See [Fast CI workflow guide](docs/observer-upgrade-2026/CI_FAST_AND_MANUAL_E2E.md).
