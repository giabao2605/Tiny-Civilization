import { useMemo, useState, useSyncExternalStore } from 'react';
import { GameCanvas } from '../game/GameCanvas';
import { GRID_HEIGHT, GRID_WIDTH, type TilePosition } from '../sim/grid';
import { createFoundationCoordinator } from './coordinator';

export function App() {
  const coordinator = useMemo(() => createFoundationCoordinator(), []);
  const snapshot = useSyncExternalStore(coordinator.subscribe, coordinator.getSnapshot);
  const [canvasVersion, setCanvasVersion] = useState(0);

  const selectTile = (tile: TilePosition) => {
    coordinator.dispatch({ type: 'select-tile', tile });
  };
  const selectedTile = snapshot.selectedTile;

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">▦</span>
          <div>
            <p className="eyebrow">AN EXPERIMENT IN EMERGENT LIFE</p>
            <h1>Tiny Civilization<span className="title-dot">.</span></h1>
          </div>
        </div>
        <span className="version-tag">PHASE 00 <span aria-hidden="true">●</span> FOUNDATION</span>
      </header>

      <main>
        <section className="introduction">
          <div>
            <p className="section-kicker">THE WORLD IS TAKING SHAPE</p>
            <h2>Một thế giới nhỏ.<br /><em>Vô vàn câu chuyện.</em></h2>
            <p className="intro-copy">
              Đây là nền móng kỹ thuật của Tiny Civilization. Bản đồ bên dưới là hình
              vẽ thử nghiệm, chưa có cư dân hay mô phỏng hoạt động.
            </p>
          </div>
          <div className="phase-note">
            <span className="note-pulse" aria-hidden="true" />
            <div><strong>Bản thử nghiệm</strong><span>Chưa phải game có thể chơi</span></div>
          </div>
        </section>

        <div className="workspace">
          <section className="world-panel" aria-labelledby="world-title">
            <div className="panel-header">
              <div>
                <p className="section-kicker">WORLD VIEW · PREVIEW</p>
                <h3 id="world-title">Bản đồ ngôi làng</h3>
              </div>
              <span className="map-dimensions">{GRID_WIDTH} × {GRID_HEIGHT} Ô</span>
            </div>
            <div className="map-frame">
              <GameCanvas
                key={canvasVersion}
                selectedTile={selectedTile}
                onTileSelected={selectTile}
              />
            </div>
            <div className="map-toolbar">
              <span><span className="legend-swatch" /> Địa hình minh họa · Nhấn vào ô để xem</span>
              <button type="button" className="ghost-button" onClick={() => setCanvasVersion((v) => v + 1)}>
                Khởi tạo lại canvas
              </button>
            </div>
          </section>

          <aside className="sidebar" aria-label="Thông tin mô phỏng">
            <section className="side-card">
              <p className="section-kicker">SETTLEMENT OVERVIEW</p>
              <h3>Tổng quan</h3>
              <div className="stat-grid">
                <div className="stat"><span>Cư dân</span><strong>{snapshot.population}</strong></div>
                <div className="stat"><span>Tick</span><strong>{snapshot.tick}</strong></div>
                <div className="stat"><span>Ngày</span><strong>01</strong></div>
                <div className="stat"><span>Trạng thái</span><strong className="stat-word">Chưa chạy</strong></div>
              </div>
              <p className="help-text">Các chỉ số hiện chưa được mô phỏng. Simulation engine sẽ xuất hiện ở Phase 01.</p>
            </section>

            <section className="side-card inspector">
              <p className="section-kicker">INSPECTOR</p>
              <h3>Kiểm tra ô đất</h3>
              <div className="selection-content" data-testid="selected-tile">
                {selectedTile ? (
                  <>
                    <span className="selection-icon" aria-hidden="true">⌖</span>
                    <strong>Ô ({selectedTile.x + 1}, {selectedTile.y + 1})</strong>
                    <span>Tọa độ nội bộ: {selectedTile.x}, {selectedTile.y}</span>
                    <button type="button" className="text-button" onClick={() => coordinator.dispatch({ type: 'clear-selection' })}>
                      Bỏ chọn
                    </button>
                  </>
                ) : (
                  <>
                    <span className="selection-icon" aria-hidden="true">⌖</span>
                    <strong>Chưa chọn ô nào</strong>
                    <span>Nhấn vào bản đồ để thử kênh giao tiếp React ↔ Phaser.</span>
                  </>
                )}
              </div>
            </section>

            <section className="side-card side-card-muted">
              <p className="section-kicker">NEXT CHAPTER</p>
              <h3>Phase 01 · Living World</h3>
              <p className="help-text">Bản đồ thật, 20 cư dân và những hành động có mục tiêu. Chưa được triển khai trong phiên bản này.</p>
            </section>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <span>TINY CIVILIZATION / ENGINEERING PREVIEW</span>
        <span>Không có dữ liệu trò chơi hoặc API bên ngoài</span>
      </footer>
    </div>
  );
}
