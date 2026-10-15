# Tiny Civilization · 0.9.0 MVP Release Candidate

**Status (2026-10-15):** Phase 07 source merged into `main` via [PR #8](https://github.com/giabao2605/Tiny-Civilization/pull/8) at `1d56f019`; [post-merge CI PASS](https://github.com/giabao2605/Tiny-Civilization/actions/runs/38676668747). Owner accepts **desktop Chrome/Edge on localhost**; public Pages deployment and Android are optional, not release blockers. No official v1 tag. Phase 08A still awaits independent player observation and PC performance/go-no-go evidence.

## Game content

One deterministic 48×48 settlement with 20, 50 or 100 starting NPCs; hourly simulation; real inventories, employment, market trades, construction, relationships, households, births and deaths; governance with finite food-aid decisions, poor-harvest and illness shocks. Select a citizen or a causal event to understand why outcomes happened. Time controls are Pause, 1×, 5× and 20×.

## Persistence

Local browser slot and manual JSON export/import. Save format 1, engine schema `sim-v5-phase06`; no backward save migration. New world creation requires confirmation; browser save is retained until explicitly saved over. Browser storage is device/browser-specific, NOT cloud save. Keep a JSON backup; quota exhaustion or clear-site-data can make local storage unavailable. JSON imports are validated before changing the running world.

## Chơi local trên máy tính (Windows, Chrome/Edge)

1. Cài Node.js 22 (npm 10), clone hoặc pull repository.
2. Chạy `npm ci` và `npm run dev`, mở `http://localhost:5173/` trong Chrome/Edge.
3. Để kiểm thử bản production: dừng dev server nếu muốn, chạy `npm run build` rồi `npm run preview`, mở địa chỉ Vite báo trong terminal (thường `http://localhost:4173/`). Không mở `dist/index.html` qua `file://`.
4. Kiểm tra 20/100 NPC, pause/1×/5×/20×, inspector, timeline, lưu/reload/xuất/nhập JSON. Port khác nhau có localStorage riêng: xuất JSON ở một port, nhập ở port kia.
5. Ghi nhận seed/tick, phiên bản Chrome/Edge, PC CPU/RAM, FPS khi 100 NPC 20×, lỗi và phản hồi người chơi. Không cần Pages hoặc Android để đánh giá bản PC.
6. Public Pages vẫn là lựa chọn phân phối phụ nếu cần, không phải GO gate. Không tạo tag v1, merge PR hay bắt đầu 08A khi thiếu quyết định riêng.

## Quality evidence and known limitations

Phase 06 main CI after merge passed (run #38673629622). Historical 100 NPC / 20× Chromium CI frame sample: ~25 FPS, 83.3 ms p95. Release-candidate after-change measurements require fresh CI evidence. First-time novice PC playtest and a sustained desktop Chrome/Edge FPS/memory session have **NOT** been performed; Android is out of scope.

This is a desktop-first, single-village game. No cloud sync, mobile performance guarantee, backend, accounts, multiplayer or Phase 08 systems. For reproducible defects file a [GitHub issue](https://github.com/giabao2605/Tiny-Civilization/issues) with seed, tick, browser and reproduction steps. All tiles and citizen icons are drawn procedurally via Phaser; the favicon is an original SVG in the repository. Third-party libraries retain their respective licenses.
