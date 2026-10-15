# Plan 04 — Day/Night & Weather | Implementation Specification v2

**Status:** READY FOR TASKING sau Plan 03. **Goal:** thời gian và thời tiết tác động đồng thời đến ánh sáng, bản đồ, âm thanh và hành vi NPC.  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Contract](../../SIMULATION_CONTRACT.md).

## 1. Clock decision, không được bỏ qua

Hiện tại **src/sim/engine.ts** định nghĩa 1 tick = 1 game-hour; **src/sim/clock.ts** có 1×/5×/20× với 2/10/40 tick/s; **src/app/livingCoordinator.ts** điều khiển scheduler, pause, visibility và save. Một ngày 1× hiện chỉ khoảng 12 giây. Deep Research đề xuất 15 phút/ngày, đây là **đề xuất sản phẩm**, chưa thể áp dụng thẳng vì ảnh hưởng nhịp kinh tế, tuổi tác, đói, lao động và NPC movement.

**Contract cố định:** giữ 1 tick/hour, 24 ticks/day, 1×/5×/20× và không catch-up khi tab hidden. Mọi thay đổi chỉ về tốc độ phát tick ngoài đời thực; cùng seed/commands và cùng N ticks phải cho cùng WorldState.

**Experiment riêng E04-A:** thêm tùy chọn Observer Pace không thay nhãn/tốc độ legacy; thử 5/10/15 phút/ngày. Với 15 phút/ngày, mỗi tick cách nhau 37,5 giây, nên NPC cần tween dọc lastMove giữa hai ticks và môi trường có animation liên tục. Nếu nhìn 30 giây không thấy hoạt động, không bật làm mặc định. Không dùng sky clock độc lập trái giờ sinh hoạt NPC. Viết ADR + test trước khi đổi default.

## 2. State và ownership

**Authoritative weather đề xuất:** kind clear/cloudy/rain/fog; intensity finite 0–1; currentSinceTick; nextTransitionTick; targetKind hoặc transition progress; weatherRngState riêng. Chỉ **src/sim** thay đổi gameplay weather theo tick, clone và save state; renderer chỉ đọc. Weather RNG riêng hoặc deterministic hash seed/tick, không tiêu thụ PRNG kinh tế cho particle/chim. Cosmetic animations có thể theo render time nhưng không tác động WorldState.

**Save migration:** v5 save không có weather phải nhận giá trị mặc định deterministic; giữ seed, tick, rngState, tiền, quan hệ, pending commands. New save validator kiểm tra enum, intensity, transition counters. Import lỗi không mutate world. Tất cả hoạt động trên legacy 48×48 và new 96×96.

**Visual layers:** terrain/wetness, light/shadow, weather particles/fog, emissive window/street lights, audio bus, NPC shelter state. Không biến overlay thành obstacle gameplay.

## 3. Chu kỳ ngày đêm đề xuất

| Game hour | Visual | World response |
|---|---|---|
| 05–07 | dawn, sáng ấm dần | chim/khói, cư dân bắt đầu ra ngoài |
| 07–17 | day | shadow rõ, chợ và công việc đông |
| 17–19 | golden hour/dusk | đèn nhà/đường bật dần |
| 19–05 | night | ánh cửa sổ ấm, ambient ban đêm, đường vắng |

Threshold cần so với **scheduledGoal(hour)** thật trong engine, không để NPC đi làm giữa bầu trời đêm. Tính blend theo giờ simulation và interpolation render; khi fast speed, tránh tween chồng gây nhấp nháy. Screenshot tick tương ứng 06/12/18/23, tắt HUD vẫn phân biệt.

## 4. Weather design và nghiệm thu bốn lớp

| Kind | Lighting | Map | Audio | NPC |
|---|---|---|---|---|
| Clear | sáng, shadow rõ | ground khô, nước lấp lánh | birds/wind | outdoor bình thường |
| Cloudy | ánh mềm | cloud shadow, màu dịu | foliage/wind | outdoor bình thường |
| Rain | dim light | wet road, puddle, roof drip, ripple | rain + roof drip | shelter/umbrella, giảm outdoor |
| Fog | low contrast | depth haze, desaturation theo lớp | muffled ambience | indoor/cautious bias nếu hợp lệ |

**Rain chain:** mây kéo đến → ánh sáng dịu → mưa → đường ướt/puddle → NPC trú → tiếng mưa → mưa dừng nhưng puddle còn lại → NPC trở lại. **Tắt particle vẫn phải phân biệt rain/fog/cloud** bằng lighting/map/NPC/audio.

Research đề xuất transition 30–90 giây. **Authoritative transition phải theo tick**, visual easing theo mode và không kéo dài vượt weather state ở fast speed. Minimum dwell đề xuất 24–72 game-hours; tune bằng seed fixtures. Basic audio unlock/mute thực hiện tại Plan 04, Plan 05 bổ sung soundscape.

## 5. Task breakdown

### E04-A — Clock ADR & Observer Pace experiment
**Làm:** đo baseline 1×/5×/20×, pause/hidden-tab, viết ADR. Prototype optional 5/10/15 phút/ngày trong coordinator/clock; giữ advanceOneTick không đổi.  
**Test:** 24 ticks/day, cùng N ticks cùng digest ở mọi speed, pause 0 tick, hidden tab không catch-up; 30s/5min observer demo.  
**DoD:** lựa chọn pace có bằng chứng, không tự đổi default khi chưa pass.

### E04-B — Day/night lighting và window/street lights
**Làm:** light curve dawn/day/dusk/night, window/street lights, smoke hooks, visual interpolation trong Phaser; HUD hiển thị giờ hiện hành.  
**Test:** 4 screenshots tại giờ 06/12/18/23 trên 48/96 map, 3 viewport; pause, speed 20×, zoom/follow; no gameplay digest change.  
**DoD:** bốn pha đọc được khi ẩn HUD, không flicker.

### E04-C — Deterministic weather state + save
**Làm:** src/sim/weather.ts (gợi ý), state machine seed-based, integrate WorldState/engine clone, validator và migration save v5, bounded transition.  
**Test:** seed replay, weatherRngState riêng, valid transitions, save round-trip, malformed save atomic, economy RNG unchanged.  
**DoD:** weather deterministic, không tạo game effect ngoài thiết kế.

### E04-D — Weather visual map response
**Làm:** 4 weather presets, wetness/puddles, rain particles có budget, fog spatial depth, water ripple; không tạo particle cho mỗi tile.  
**Test:** 4 screenshots + particle-OFF comparison, transition/puddle persistence, resize/zoom, 100 NPC perf.  
**DoD:** weather nhận ra được mà không cần particle.

### E04-E — NPC reaction và basic audio
**Làm:** dùng shelter POI Plan 02 + route hooks Plan 03, NPC có reason trú mưa, bounded cooldown và fallback; critical needs vẫn ưu tiên. Umbrella có thể cosmetic. Basic rain/clear audio bus, mute/unlock theo browser policy.  
**Test:** rain-shelter fixture, unreachable shelter, hunger priority, no transaction loss, mute/audio lifecycle, no autoplay error.  
**DoD:** đủ 4 lớp lighting/map/audio/NPC, không route loop.

### E04-F — Integration & pacing validation
**Làm:** chạy 48/96, 20/50/100 NPC, 3 viewport, observer/legacy modes, performance và leak profile.  
**Test:** unit/E2E, save v5/v6, replay, screenshots, 60–120min soak nếu môi trường cho phép.  
**DoD:** evidence rõ ràng; nếu thiếu hardware/soak ghi PARTIAL.

## 6. PASS/FAIL và rollback

**PASS:** canonical clock không đổi; 4 pha ngày đêm; clear/cloudy/rain/fog seeded; 4-layer weather; save migration/replay; reduced motion và mute; NPC critical needs/kinh tế/xã hội/chính quyền không regression. Observer Pace là gate riêng, có thể để optional nếu chưa đạt.

**FAIL:** weather chỉ là particle, dùng wall-clock RNG cho gameplay, sky time lệch giờ NPC, phá legacy speeds, phát audio khi chưa unlock hoặc mất dữ liệu v5.

**Rollback:** tắt observer pace/visual weather bằng feature flag; bảo tồn old-save reader, không xóa dữ liệu người dùng. Handoff gồm clock ADR, fixtures, screenshots, test results, profile và PR.

## 7. Prompt cho ChatGPT Task

> Đọc Master Observer Upgrade, Plan 04, Simulation Contract, Progress, clock.ts, livingCoordinator.ts, engine.ts, save.ts, WorldScene.ts. Chỉ thực hiện **E04-[A/B/C/D/E/F]**. Không đổi 1 tick/hour, legacy speed presets hoặc economic RNG nếu chưa có ADR. Gameplay weather deterministic, có save migration và test pause/hidden-tab/replay. Cung cấp 4-phase/4-weather screenshots và audio evidence phù hợp task. Branch/PR riêng, ghi test thực tế và blockers; không tự merge code.

**Gate sang Plan 05:** weather/time state ổn định, basic audio bus và event anchors sẵn sàng.
