import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { GameCanvas } from '../game/GameCanvas';
import { dayOf, hourOf, stateDigest } from '../sim/engine';
import { GRID_HEIGHT, GRID_WIDTH } from '../sim/grid';
import { getSite, type Activity, type WorldEvent } from '../sim/world';
import { createLivingCoordinator } from './livingCoordinator';

const ACTIVITY: Record<Activity, string> = {
  rest: 'Nghỉ tại nhà',
  travelToWork: 'Đến chỗ làm',
  atWork: 'Đang làm việc (theo lịch)',
  travelToCommons: 'Đến quảng trường',
  socialIdle: 'Giao lưu ở quảng trường',
  travelHome: 'Trở về nhà',
  travelToFood: 'Đi lấy thức ăn',
  eating: 'Đang ăn',
  waitingForFood: 'Đợi thức ăn',
  dead: 'Đã chết',
};
const EVENT_LEVEL: Record<WorldEvent['type'], 'info' | 'warning' | 'critical'> = {
  founded: 'info', departure: 'info', work: 'info', gather: 'info',
  home: 'info', routeBlocked: 'warning', foodProduced: 'info',
  woodProduced: 'info', foodEaten: 'info', shortage: 'warning',
  depleted: 'warning', recovery: 'info', danger: 'critical', death: 'critical',
};
const EVENTS: Record<WorldEvent['type'], string> = {
  founded: 'Thành lập làng',
  departure: 'Bắt đầu di chuyển',
  work: 'Bắt đầu làm việc',
  gather: 'Tụ họp',
  home: 'Về nhà',
  routeBlocked: 'Không tìm được đường',
  foodProduced: 'Thu hoạch food',
  woodProduced: 'Khai thác wood',
  foodEaten: 'Ăn',
  shortage: 'Thiếu lương thực',
  depleted: 'Cạn tài nguyên',
  recovery: 'Hồi phục',
  danger: 'Sức khỏe nguy hiểm',
  death: 'Tử vong',
};

export function App() {
  const coordinator = useMemo(() => createLivingCoordinator(12345), []);
  const snapshot = useSyncExternalStore(coordinator.subscribe, coordinator.getSnapshot);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [seedInput, setSeedInput] = useState('12345');
  const { world, selectedCitizenId, paused, speed } = snapshot;
  const citizen = world.citizens.find((item) => item.id === selectedCitizenId);
  const day = dayOf(world.tick);
  const hour = hourOf(world.tick);
  const living = world.citizens.filter((item) => item.alive);
  const hungry = living.filter((item) => item.hunger <= 55).length;
  const endangered = living.filter((item) => item.health <= 25).length;
  const runway = world.stats.foodConsumedYesterday > 0
    ? (world.inventory.food / world.stats.foodConsumedYesterday).toFixed(1) + ' ngày'
    : 'Chưa đủ dữ liệu';
  const jobNames = { farmer: 'Nông dân', woodcutter: 'Tiều phu', other: 'Nhân viên kho' } as const;

  useEffect(() => coordinator.start(), [coordinator]);

  const setSeed = () => {
    const value = Number(seedInput);
    if (Number.isSafeInteger(value)) coordinator.dispatch({ type: 'reset-seed', seed: value });
  };

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
        <span className="version-tag">PHASE 02 <span aria-hidden="true">●</span> SURVIVAL</span>
      </header>

      <main>
        <section className="introduction">
          <div>
            <p className="section-kicker">LIFE BEGINS IN THE VALLEY</p>
            <h2>Một ngôi làng nhỏ.<br /><em>Hai mươi cuộc đời.</em></h2>
            <p className="intro-copy">Hai mươi con người phải sản xuất thức ăn, khai thác gỗ, ăn và ngủ. Khi nguồn cung thiếu hụt, sức khỏe và những quyết định của họ thật sự thay đổi.</p>
          </div>
          <div className="phase-note">
            <span className="note-pulse" aria-hidden="true" />
            <div><strong>Thế giới đang {paused ? 'tạm dừng' : 'chuyển động'}</strong><span>Seed {world.seed} · {living.length}/{world.citizens.length} cư dân còn sống</span></div>
          </div>
        </section>

        <div className="workspace">
          <section className="world-panel" aria-labelledby="world-title">
            <div className="panel-header">
              <div>
                <p className="section-kicker">LIVING SETTLEMENT · {String(hour).padStart(2, '0')}:00</p>
                <h3 id="world-title">Ngôi làng đang sống</h3>
              </div>
              <span className="map-dimensions">{GRID_WIDTH} × {GRID_HEIGHT} Ô</span>
            </div>
            <div className="map-frame">
              <GameCanvas
                key={canvasVersion}
                snapshot={snapshot}
                onCitizenSelected={(id) => coordinator.dispatch({ type: 'select-citizen', id })}
              />
            </div>
            <div className="map-toolbar">
              <span>Cuộn để phóng to · Kéo để di chuyển · Nhấn vào cư dân</span>
              <button type="button" className="ghost-button" onClick={() => setCanvasVersion((v) => v + 1)}>Khởi tạo lại canvas</button>
            </div>
            <div className="legend-row" aria-label="Chú giải bản đồ">
              <span><i className="legend-tile grass" />Đồng cỏ</span>
              <span><i className="legend-tile forest" />Rừng</span>
              <span><i className="legend-tile water" />Nước</span>
              <span><i className="legend-tile road" />Đường</span>
              <span><i className="legend-tile residents" />Cư dân</span>
              <span><i className="legend-tile field" />Ruộng sản xuất</span>
              <span><i className="legend-tile depleted" />Nguồn cạn</span>
            </div>
          </section>

          <aside className="sidebar" aria-label="Thông tin mô phỏng">
            <section className="side-card">
              <p className="section-kicker">SETTLEMENT OVERVIEW</p>
              <h3>Nhịp sống của làng</h3>
              <div className="stat-grid">
                <div className="stat"><span>Ngày</span><strong data-testid="day-value">{String(day).padStart(2, '0')}</strong></div>
                <div className="stat"><span>Giờ</span><strong data-testid="hour-value">{String(hour).padStart(2, '0')}:00</strong></div>
                <div className="stat"><span>Cư dân sống</span><strong data-testid="population-value">{living.length}</strong></div>
                <div className="stat"><span>Trạng thái</span><strong className="stat-word" data-testid="play-status">{paused ? 'Tạm dừng' : 'Đang chạy'}</strong></div>
              </div>
              <div className="resource-dashboard" aria-label="Kho tài nguyên và nhu cầu">
                <div className="resource-value"><span>Food trong kho</span><strong data-testid="food-stock">{world.inventory.food}</strong></div>
                <div className="resource-value"><span>Wood trong kho</span><strong data-testid="wood-stock">{world.inventory.wood}</strong></div>
                <div className="resource-value"><span>Food sản xuất / ngày</span><strong data-testid="food-produced">{world.stats.foodProducedToday}</strong></div>
                <div className="resource-value"><span>Food tiêu thụ / ngày</span><strong data-testid="food-consumed">{world.stats.foodConsumedToday}</strong></div>
                <div className="resource-value"><span>Số ngày dự trữ ước tính</span><strong data-testid="food-runway">{runway}</strong></div>
                <div className="resource-value"><span>NPC đang đói</span><strong data-testid="hungry-count">{hungry}</strong></div>
                <div className="resource-value"><span>NPC sức khỏe nguy hiểm</span><strong data-testid="danger-count">{endangered}</strong></div>
              </div>
              <p className="dashboard-note">Sản xuất và tiêu thụ tính từ đầu ngày trong game. Dự trữ ước tính dựa trên tiêu thụ của ngày hoàn chỉnh gần nhất.</p>
              <div className="time-controls" aria-label="Điều khiển thời gian">
                <button type="button" className={paused ? 'control active' : 'control'} onClick={() => coordinator.dispatch({ type: 'set-paused', paused: !paused })} aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}>{paused ? '▶ Tiếp tục' : 'Ⅱ Tạm dừng'}</button>
                {([1, 5, 20] as const).map((value) => (
                  <button key={value} type="button" className={speed === value ? 'control active' : 'control'} onClick={() => coordinator.dispatch({ type: 'set-speed', speed: value })} aria-pressed={speed === value}>{value}×</button>
                ))}
              </div>
              <div className="seed-controls">
                <label htmlFor="seed-input">Seed thế giới</label>
                <div>
                  <input id="seed-input" type="number" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
                  <button type="button" className="ghost-button" onClick={setSeed}>Tạo lại</button>
                </div>
              </div>
              <p className="debug-line" data-testid="world-tick">Tick {world.tick} · Seed {world.seed}{import.meta.env.DEV ? ' · #' + stateDigest(world) : ''}</p>
            </section>

            <section className="side-card inspector">
              <p className="section-kicker">CITIZEN INSPECTOR</p>
              <h3>Thông tin cư dân</h3>
              <div className="selection-content" data-testid="selected-citizen">
                {citizen ? (
                  <>
                    <div className="citizen-identity">
                      <span className={'citizen-avatar shade-' + citizen.appearance} aria-hidden="true">●</span>
                      <div><strong>{citizen.name}</strong><span>{citizen.age} tuổi · ID #{citizen.id}</span></div>
                    </div>
                    <dl className="info-list">
                      <dt>Trạng thái</dt><dd data-testid="citizen-life">{citizen.alive ? 'Còn sống' : 'Đã chết'}</dd>
                      <dt>Nghề</dt><dd data-testid="citizen-job">{jobNames[citizen.job]}</dd>
                      <dt>Đang làm</dt><dd>{ACTIVITY[citizen.activity]}</dd>
                      <dt>Vị trí</dt><dd>({citizen.tile.x}, {citizen.tile.y})</dd>
                      <dt>Nhà</dt><dd>{getSite(world, citizen.homeId).name}</dd>
                      <dt>Nơi làm việc</dt><dd>{getSite(world, citizen.workId).name}</dd>
                      <dt>Mục tiêu</dt><dd>{citizen.goal === 'food' ? 'Nhận thức ăn' : citizen.goal === 'home' ? 'Trở về nhà' : citizen.goal === 'work' ? 'Đi làm' : 'Gặp gỡ cộng đồng'}</dd>
                      <dt>Thời gian hành động</dt><dd>{citizen.actionDuration ? citizen.actionDuration + ' giờ; tiến độ ' + citizen.workHours + ' giờ' : 'Không có'}</dd>
                      <dt>Điểm đến</dt><dd>({citizen.destination.x}, {citizen.destination.y})</dd>
                    </dl>
                    <div className="needs-panel" data-testid="citizen-needs">
                      {([
                        ['Mức no', citizen.hunger, 'hunger'],
                        ['Năng lượng', citizen.energy, 'energy'],
                        ['Sức khỏe', citizen.health, 'health'],
                      ] as const).map(([label, value, key]) => (
                        <div className="need" key={key}>
                          <div><span>{label}</span><strong data-testid={'need-' + key}>{value}/100</strong></div>
                          <div className="need-track" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
                            <span className={value <= 25 ? 'need-fill low' : 'need-fill'} style={{ width: value + '%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="reason-text"><strong>Vì sao?</strong> {citizen.reason}</p>
                    <p className="recent-title">Hoạt động gần đây</p>
                    <ul className="recent-list">{citizen.recent.slice(-5).reverse().map((entry, i) => (
                      <li key={entry.tick + ':' + entry.activity + ':' + i}><span>Tick {entry.tick} · {ACTIVITY[entry.activity]}</span>{entry.reason}</li>
                    ))}</ul>
                    <button type="button" className="text-button" onClick={() => coordinator.dispatch({ type: 'select-citizen', id: null })}>Bỏ chọn</button>
                  </>
                ) : (
                  <><span className="selection-icon" aria-hidden="true">⌖</span><strong>Chưa chọn cư dân</strong><span>Nhấn một nhân vật trên bản đồ hoặc chọn tên bên dưới.</span></>
                )}
              </div>
            </section>

            <section className="side-card" aria-label="Danh sách cư dân">
              <p className="section-kicker">PEOPLE OF THE VALLEY</p>
              <h3>{living.length}/20 cư dân còn sống</h3>
              <div className="citizen-list">
                {world.citizens.map((item) => (
                  <button key={item.id} type="button" data-testid={'citizen-' + item.id} className={(item.id === selectedCitizenId ? 'citizen-row chosen' : 'citizen-row') + (!item.alive ? ' citizen-dead' : '')} onClick={() => coordinator.dispatch({ type: 'select-citizen', id: item.id })}>
                    <span className={'citizen-dot shade-' + item.appearance} />
                    <span>{item.name}</span>
                    <small>{ACTIVITY[item.activity]}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="side-card event-card">
              <p className="section-kicker">LIVING HISTORY</p>
              <h3>10 sự kiện gần nhất</h3>
              <ol className="event-feed" data-testid="event-feed">
                {world.events.slice(-10).reverse().map((event) => (
                  <li key={event.id} className={'event-' + EVENT_LEVEL[event.type]}><span>Ngày {dayOf(event.tick)} · {String(hourOf(event.tick)).padStart(2, '0')}:00 · {EVENTS[event.type]}</span><p>{event.reason}</p></li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>

      <footer className="site-footer"><span>TINY CIVILIZATION / PHASE 02</span><span>20 NPC · Nhu cầu thật · Tài nguyên hữu hạn · Chưa có kinh tế</span></footer>
    </div>
  );
}
