# Plan 05 — Ambient Events & Audio | Implementation Specification v2

**Status:** READY FOR TASKING sau Plan 04. **Goal:** thế giới có chuyện nhỏ đáng xem mà không cần click, âm thanh dễ chịu và không biến ambient thành cơ chế kinh tế giả.  
**Nguồn:** [Master](../MASTER_PLAN.md) · [Research](../RESEARCH_SOURCE.md) · [Simulation Contract](../../SIMULATION_CONTRACT.md).

## 1. Baseline và phân tách hai loại event

**Đã có:** src/sim/world.ts WorldEvent, src/sim/engine.ts announce(...) và bounded event history; src/sim/social.ts có encounter/friendship/dispute; src/app/App.tsx có timeline/filter. Đây là **sự kiện gameplay có nguyên nhân**; không xóa/ghi đè chỉ để tạo ambient. Plan 02 cung cấp district/POI/event anchors; Plan 03 cung cấp route/goal; Plan 04 cung cấp weather/time và basic audio.

**Hai lớp rõ ràng:**
1. **Causal gameplay event:** phát sinh từ engine theo tick, lưu trong WorldState và save, có ảnh hưởng gameplay nếu luật quy định.
2. **Cosmetic ambient vignette:** chim, chó/mèo, xe đẩy trang trí, khói, người đứng trò chuyện bằng animation, cửa mở/đóng, bell; không thay tiền/stock/quan hệ/goal. Scheduler riêng, state bounded; có thể tái tạo theo seed + presentation time/sequence, không dùng PRNG kinh tế.

Nếu một ambient event thực sự thay đổi quan hệ/stock/health, nó phải chuyển thành gameplay event qua engine và test contract, **không cập nhật từ Phaser**.

## 2. Event catalog MVP

| Event ID | Điều kiện | Visual/audio | Quyền hạn |
|---|---|---|---|
| market-open / market-close | giờ, Civic district | stall canopy/lantern, chợ đông/vắng | visual-only; không tự thay stock |
| cart-delivery | main road, giờ hoạt động, không mưa nặng | cart đi qua route an toàn, wheel sound | cosmetic actor, không chiếm citizen ID |
| plaza-chat | 2 NPC gần nhau hoặc POI social hợp lệ | pause/emote/gesture | không tự tăng affinity |
| bird-visit | Nature/Waterfront, clear/cloudy | chim đáp/bay, chirp | cosmetic |
| pet-wander | Residential, daytime | chó/mèo đi dạo ngắn | cosmetic, không chặn đường |
| chimney-smoke | dawn/dusk, home | smoke particle nhẹ | cosmetic |
| rain-shelter-visual | rain, shelter anchor | umbrella/roof drip | dựa NPC goal thực, không tạo goal |
| bell-hour | Civic, giờ quy định | bell one-shot | audio/cosmetic |
| puddle-bird | sau rain, puddle anchor | chim tắm nước | cosmetic |
| window-light | dusk/night | light toggle | do Plan 04, event director chỉ phối hợp |

**MVP tối thiểu:** cart, plaza-chat, birds/pets, market open/close, smoke/bell, rain reactions. Không cần implement tất cả cùng lúc; đạt ≥3 categories trong 5 phút seed/fixture và 30s sign-of-life.

## 3. Scheduler, rate và an toàn

**Inputs:** district, authoritative game hour/weather, anchor catalog, NPC proximity, presentation elapsed, event seed, active budget.  
**Outputs:** start/end cosmetic event, anchor, actor visual ID, duration, reason; không thay WorldState.

**Thiết kế đề xuất:**
- Tối đa **3–5 active vignettes toàn world** ở mức zoom bình thường (tune bằng FPS); tối đa 1–2 event cùng anchor; cooldown mỗi event type/anchor để không lặp liên tục.
- Prioritize visible district nhưng **không thay gameplay theo camera**. Offscreen ambient có thể skip rendering; scheduler/test phải phân biệt “scheduled” và “visible”.
- Dùng deterministic cosmetic RNG/virtual-time scheduler cho tests; tránh Math.random trong quyết định event nếu cần replay. Nếu event rate tính bằng real minutes, lưu/khôi phục cosmetic state riêng khi cần, hoặc chấp nhận reset sau reload nhưng **ghi rõ** không ảnh hưởng economic replay.
- 30s sign-of-life và ≥3 event categories/5min là acceptance **trong observer test fixture**, không ép mọi seed sinh ngẫu nhiên đủ sự kiện.
- Event có start/end/cancel cleanup, không tạo timer/particle tồn tại mãi khi reset seed/load save/scene shutdown; cap event log/one-shots.
- Tắt animation/sound với reduced-motion/mute, không tắt gameplay.

## 4. Audio contract

**Buses:** ambience (day/night/wind/rain), localized one-shots (cart/bell/birds/roof drip), master volume/mute; có thể thêm district-specific bus sau MVP. Soundscape phải không lấn tiếng làm việc ngoài đời, có crossfade và cap polyphony. Sound có license rõ hoặc procedural/original; không sao chép asset game tham chiếu.

**Browser/local policy:** WebAudio unlock sau user gesture; mặc định mute hoặc silent-until-unlock; không tạo promise rejection khi autoplay bị chặn. Settings lưu local UI preferences, không sửa WorldState. Tab hidden/paused phải có chính sách nhất quán: giảm hoặc mute ambience khi hidden, pause world thì âm thanh môi trường có thể giảm/tạm dừng theo UX, ghi test. Không phát một bell nhiều lần do re-render.

**Accessibility:** mute, volume slider nếu có, reduced motion, không flashing, hạn chế âm thanh đột ngột; UI phản hồi trạng thái audio đã unlock.

## 5. Task breakdown

### A05-A — Event taxonomy và instrumentation
**Làm:** audit WorldEvent/event feed/social; định nghĩa ambient schema và phân biệt causal vs cosmetic; lập event catalog, anchor ownership, budget/cooldown và test fixtures.  
**Test:** type schema, no WorldState mutation, bounded active events, deterministic virtual time.  
**DoD:** event director contract rõ; không phát sinh gameplay side effects.

### A05-B — Scheduler + actor lifecycle
**Làm:** tạo module gợi ý src/game/ambient/ (hoặc src/app nếu cần lifecycle), scheduler independent RNG; event start/end/cancel, visibility-aware rendering, cleanup on scene restart.  
**Test:** 5-minute virtual clock with seed fixture, cooldown, no duplicate anchor, reset/load/hidden handling, 100 NPC budget.  
**DoD:** scheduler predictable, no leaks, no replay divergence.

### A05-C — 3–5 visual vignette types
**Làm:** triển khai market open/close, cart, birds/pets, plaza-chat, chimney smoke hoặc bell; anchor trong 3 districts; layering/occlusion từ Plan 01.  
**Test:** 30s visible sign-of-life, 5min ≥3 distinct categories fixture, no actor blocking citizen path/click, camera follow/fit.  
**DoD:** observer nhìn được hành động có điểm bắt đầu/kết thúc, không chỉ random particle.

### A05-D — Audio buses, spatial cues và settings
**Làm:** hoàn thiện rain/day/night ambience từ Plan 04; audio unlock, mute, crossfade, one-shots, volume settings, license inventory.  
**Test:** autoplay-denied browser, mute/unmute, speed/pause, reset/load, hidden tab, one-shot polyphony cap.  
**DoD:** không exception, không âm thanh bất ngờ, ambient phù hợp district/weather.

### A05-E — Watchability tuning & performance
**Làm:** điều chỉnh event rate, cooldown, visual budget theo viewport/zoom, 20/50/100 NPC; đo draw objects/particle count/FPS; video 5min và 20–30min sample.  
**Test:** deterministic fixture repeated, 48/96, 3 viewports, 60min soak nếu có; check no repeated spam/route interference.  
**DoD:** ≥3 categories/5min fixture; gameplay digest không đổi khi bật/tắt ambient; perf gate ghi rõ.

## 6. PASS/FAIL và handoff

**PASS:** causal vs cosmetic không lẫn; ít nhất 3 event categories/5min trong fixture, có 30s sign-of-life, audio day/night/rain + one-shots với mute/unlock, lifecycle cleanup, no WorldState divergence, screenshot/video + test/metrics.

**FAIL:** fake event làm tăng tiền/affinity; camera offscreen làm NPC gameplay biến mất; chỉ lặp khói ba lần rồi tính ba categories; browser autoplay crash; thiếu asset license; không cleanup scene restart.

**Rollback:** toggle ambient director và audio independently, không migrate economic save. Bàn giao event catalog + seeded fixture, audio licenses, video/screenshot, profile và PR links.

## 7. Prompt cho ChatGPT Task

> Đọc Master Observer Upgrade, Plan 05, Simulation Contract, Progress, existing WorldEvent/social engine, WorldScene, time/weather state. Chỉ làm **A05-[A/B/C/D/E]**. Phân biệt gameplay event và cosmetic vignette; tuyệt đối không thay economy/social/governance từ renderer. Scheduler bounded/deterministic khi test, audio phải mute/unlock và có license. Tạo branch/PR riêng, chạy tests, cung cấp watchability evidence và handoff; không tự merge code.

**Gate sang tổng QA:** 5-minute observer fixture pass và soundscape hoạt động local, không ảnh hưởng replay.
