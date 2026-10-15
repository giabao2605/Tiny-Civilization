import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { GameCanvas } from '../game/GameCanvas';
import { ENGINE_VERSION, LOCAL_SAVE_KEY, MAX_SAVE_BYTES } from '../persistence/save';
import { dayOf, hourOf, stateDigest } from '../sim/engine';
import { foodAidRejection } from '../sim/governance';
import { GRID_HEIGHT, GRID_WIDTH } from '../sim/grid';
import { getSite, housing, totalCurrency, type Activity, type WorldEvent, type EventType } from '../sim/world';
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
  travelToMarket: 'Đang đến chợ', trading: 'Đang giao dịch',
  travelToBuild: 'Đến công trình', building: 'Đang xây dựng',
};
const EVENT_LEVEL: Record<WorldEvent['type'], 'info' | 'warning' | 'critical'> = {
  founded: 'info', departure: 'info', work: 'info', gather: 'info',
  home: 'info', routeBlocked: 'warning', foodProduced: 'info',
  woodProduced: 'info', foodEaten: 'info', shortage: 'warning',
  depleted: 'warning', recovery: 'info', danger: 'critical', death: 'critical',
  sold: 'info', bought: 'info', bankrupt: 'warning', marketEmpty: 'warning',
  marketInsolvent: 'warning', constructionStarted: 'info', constructionDone: 'info',
  constructionShortage: 'warning', unemployed: 'warning', homeless: 'warning',
  encounter: 'info', friendship: 'info', dispute: 'warning', rivalry: 'warning',
  householdFormed: 'info', birth: 'info', socialAvoid: 'info',
  leaderChosen: 'info', leaderVacant: 'warning', foodAid: 'info', foodAidDenied: 'warning',
  shockStarted: 'warning', shockImpact: 'warning', shockEnded: 'info', illnessRecovered: 'info',
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
  sold: 'Bán hàng', bought: 'Mua hàng', bankrupt: 'Không đủ tiền',
  marketEmpty: 'Chợ hết hàng', marketInsolvent: 'Chợ thiếu quỹ/chỗ',
  constructionStarted: 'Khởi công', constructionDone: 'Hoàn thành nhà',
  constructionShortage: 'Thiếu vật tư', unemployed: 'Đổi việc', homeless: 'Vô gia cư',
  encounter: 'Gặp gỡ', friendship: 'Tình bạn', dispute: 'Mâu thuẫn',
  rivalry: 'Đối địch', householdFormed: 'Lập hộ gia đình', birth: 'Em bé chào đời', socialAvoid: 'Tránh mặt',
  leaderChosen: 'Chọn trưởng làng', leaderVacant: 'Trống chức', foodAid: 'Cứu trợ',
  foodAidDenied: 'Từ chối cứu trợ', shockStarted: 'Biến cố bắt đầu', shockImpact: 'Tác động thực tế',
  shockEnded: 'Biến cố kết thúc', illnessRecovered: 'Khỏi bệnh',
};

type TimelineCategory = 'all' | 'social' | 'economy' | 'survival' | 'governance';
const SOCIAL_TYPES = new Set<EventType>(['encounter', 'friendship', 'dispute', 'rivalry', 'householdFormed', 'birth', 'socialAvoid']);
const ECONOMY_TYPES = new Set<EventType>(['sold', 'bought', 'bankrupt', 'marketEmpty', 'marketInsolvent',
  'constructionStarted', 'constructionDone', 'constructionShortage', 'unemployed', 'homeless']);
const GOVERNANCE_TYPES = new Set<EventType>(['leaderChosen', 'leaderVacant', 'foodAid', 'foodAidDenied',
  'shockStarted', 'shockImpact', 'shockEnded', 'illnessRecovered']);
function categoryOf(type: EventType): Exclude<TimelineCategory, 'all'> {
  return SOCIAL_TYPES.has(type) ? 'social' : ECONOMY_TYPES.has(type) ? 'economy' :
    GOVERNANCE_TYPES.has(type) ? 'governance' : 'survival';
}

export function App() {
  const coordinator = useMemo(() => {
    const fixture = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('fixture') : null;
    return createLivingCoordinator(12345, 20, fixture === 'governance-food-shortage' ||
      fixture === 'governance-empty-reserve' ? fixture : undefined);
  }, []);
  const snapshot = useSyncExternalStore(coordinator.subscribe, coordinator.getUiSnapshot);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [timelineCategory, setTimelineCategory] = useState<TimelineCategory>('all');
  const [inspectedEventId, setInspectedEventId] = useState<number | null>(null);
  const [seedInput, setSeedInput] = useState('12345');
  const [populationInput, setPopulationInput] = useState<20 | 50 | 100>(20);
  const [saveMessage, setSaveMessage] = useState('Chưa lưu trong phiên này. File JSON có thể sao lưu sang thiết bị khác.');
  const [saveTick, setSaveTick] = useState<number | null>(null);
  const { world, selectedCitizenId, paused, speed } = snapshot;
  const governance = world.governance;
  const leader = world.citizens.find(c => c.id === governance.leaderId);
  const aidReason = foodAidRejection({ ...world, tick: world.tick + 1 }, governance.leaderId ?? -1, world.tick + 1);
  const sick = world.citizens.filter(c => c.alive && c.illnessUntil > world.tick).length;
  const citizen = world.citizens.find((item) => item.id === selectedCitizenId);
  const selectedHousehold = world.households.find((house) => house.id === citizen?.householdId);
  const ties = citizen ? Object.entries(citizen.relations)
    .map(([id, tie]) => ({ other: world.citizens.find((c) => c.id === Number(id)), tie }))
    .filter((x) => x.other && x.other.alive).sort((a, b) => Math.abs(b.tie.affinity) - Math.abs(a.tie.affinity) ||
      a.other!.id - b.other!.id).slice(0, 8) : [];
  const inspectedEvent = world.events.find(event => event.id === inspectedEventId);
  const inspectedNode = inspectedEvent?.nodeId === undefined ? undefined :
    world.resourceNodes.find(node => node.id === inspectedEvent.nodeId);
  const visibleEvents = world.events.filter((event) => timelineCategory === 'all' ||
    categoryOf(event.type) === timelineCategory).slice(-10).reverse();
  const day = dayOf(world.tick);
  const hour = hourOf(world.tick);
  const living = world.citizens.filter((item) => item.alive);
  const hungry = living.filter((item) => item.hunger <= 55).length;
  const endangered = living.filter((item) => item.health <= 25).length;
  const runway = world.stats.foodConsumedYesterday > 0
    ? (world.inventory.food / world.stats.foodConsumedYesterday).toFixed(1) + ' ngày'
    : 'Chưa đủ dữ liệu';
  const jobNames = { farmer: 'Nông dân', woodcutter: 'Tiều phu', builder: 'Thợ xây', other: 'Chưa có việc' } as const;
  const homes = housing(world);
  const employed = living.filter((item) => item.job !== 'other').length;
  const market = world.market;
  const totalMoney = totalCurrency(world);
  const activeSites = world.constructions.filter((site) => site.status === 'active');
  const averageHealth = living.length ? Math.round(living.reduce((sum, c) => sum + c.health, 0) / living.length) : 0;

  useEffect(() => coordinator.start(), [coordinator]);

  const setSeed = () => {
    const value = Number(seedInput);
    if (!seedInput.trim() || !Number.isSafeInteger(value)) {
      setSaveMessage('Seed phải là số nguyên hợp lệ.');
      return;
    }
    // A new world must never silently discard the current unsaved timeline.
    if (!window.confirm('Tạo thế giới mới? Tiến trình chưa lưu của thế giới hiện tại sẽ mất. Bản lưu trong trình duyệt và file JSON đã xuất sẽ được giữ nguyên.')) return;
    setInspectedEventId(null);
    if (coordinator.dispatch({ type: 'reset-seed', seed: value, population: populationInput })) {
      setSaveTick(null);
      setSaveMessage('Đã tạo thế giới mới. Bản lưu trong trình duyệt trước đó vẫn còn cho đến khi bạn lưu đè.');
    }
  };

  const saveToBrowser = () => {
    try {
      const current = coordinator.getSnapshot().world;
      const json = coordinator.exportSave();
      window.localStorage.setItem(LOCAL_SAVE_KEY, json);
      setSaveTick(current.tick);
      setSaveMessage('Đã lưu tick ' + current.tick + ' vào trình duyệt (' + new Blob([json]).size + ' byte).');
    } catch (error) {
      setSaveMessage('Lưu thất bại: ' + (error instanceof Error ? error.message : 'Không có quyền lưu hoặc hết quota') +
        '. Thử Xuất JSON để giữ bản sao.');
    }
  };
  const restore = (json: string, origin: string) => {
    coordinator.importSave(json);
    const restored = coordinator.getSnapshot().world;
    setSeedInput(String(restored.seed));
    setPopulationInput(restored.citizens.length <= 20 ? 20 : restored.citizens.length <= 50 ? 50 : 100);
    setInspectedEventId(null);
    // Imported snapshots can be at the same or a later tick. Remount Phaser to avoid stale sprites.
    setCanvasVersion(version => version + 1);
    setSaveTick(restored.tick);
    setSaveMessage('Đã tải ' + origin + ' ở tick ' + restored.tick + '. Trò chơi tạm dừng để kiểm tra.');
  };
  const loadFromBrowser = () => {
    try {
      const json = window.localStorage.getItem(LOCAL_SAVE_KEY);
      if (json === null) throw new Error('Chưa có bản lưu trong trình duyệt.');
      restore(json, 'bản lưu trình duyệt');
    } catch (error) { setSaveMessage('Tải thất bại: ' + (error instanceof Error ? error.message : String(error))); }
  };
  const exportJson = () => {
    try {
      const current = coordinator.getSnapshot().world;
      const json = coordinator.exportSave();
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'tiny-civilization-seed-' + current.seed + '-tick-' + current.tick + '.json';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSaveMessage('Đã tạo file JSON tick ' + current.tick + '.');
    } catch (error) { setSaveMessage('Xuất thất bại: ' + (error instanceof Error ? error.message : String(error))); }
  };
  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > MAX_SAVE_BYTES) throw new Error('File vượt giới hạn 8 MiB.');
      const json = await file.text();
      restore(json, 'file JSON');
    } catch (error) { setSaveMessage('Import thất bại: ' + (error instanceof Error ? error.message : String(error))); }
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
        <span className="version-tag">MVP RC 0.9.0 <span aria-hidden="true">●</span> BUILD</span>
      </header>

      <main>
        <section className="introduction">
          <div>
            <p className="section-kicker">LIFE BEGINS IN THE VALLEY</p>
            <h2>Một ngôi làng nhỏ.<br /><em>{world.citizens.length} cuộc đời.</em></h2>
            <p className="intro-copy">Cư dân tự kiếm sống, kết bạn và xây dựng gia đình; trưởng làng đưa ra quyết định hữu hạn khi mất mùa hay bệnh tật đe dọa.</p>
            <p className="quick-start" data-testid="onboarding"><strong>Bắt đầu:</strong> Chọn dân số và Seed rồi tạo thế giới. Dùng 1×/5×/20× để theo dõi, nhấn vào cư dân để xem lý do hành động. Lưu trong trình duyệt hoặc xuất JSON trước khi đóng tab. Mỗi tick tương đương 1 giờ game; Seed giống nhau sẽ tạo thế giới giống nhau.</p>
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
              <span>🏪 Chợ trung tâm · 🏠 Nhà · 🛠 Công trình</span>
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
                <div className="resource-value"><span>Wood trong kho chợ</span><strong data-testid="wood-stock">{world.inventory.wood}</strong></div>
                <div className="resource-value"><span>Tiền tại chợ</span><strong data-testid="market-cash">{market.cash}</strong></div>
                <div className="resource-value"><span>Tổng tiền bảo toàn</span><strong data-testid="total-currency">{totalMoney}</strong></div>
                <div className="resource-value"><span>Nhà ở</span><strong data-testid="housing-capacity">{homes.occupied}/{homes.capacity}</strong></div>
                <div className="resource-value"><span>Vô gia cư</span><strong data-testid="homeless-count">{homes.homeless}</strong></div>
                <div className="resource-value"><span>Có việc / chưa có việc</span><strong data-testid="employed-count">{employed}/{living.length - employed}</strong></div>
                <div className="resource-value"><span>Giao dịch hoàn tất</span><strong data-testid="trade-count">{market.completedTrades}</strong></div>
                <div className="resource-value"><span>Chợ mua từ dân</span><strong data-testid="market-bought-units">{market.boughtFromCitizens} đơn vị</strong></div>
                <div className="resource-value"><span>Chợ bán cho dân</span><strong data-testid="market-sold-units">{market.soldToCitizens} đơn vị</strong></div>
                <div className="resource-value"><span>Khối lượng giao dịch hôm nay</span><strong data-testid="trade-volume">{market.volumeToday}</strong></div>
                <div className="resource-value"><span>Công trình đang xây</span><strong data-testid="construction-count">{activeSites.length}</strong></div>
                <div className="resource-value"><span>Hộ gia đình</span><strong data-testid="household-count">{world.households.length}</strong></div>
                <div className="resource-value"><span>Lượt giao lưu</span><strong data-testid="social-encounters">{world.social.encounters}</strong></div>
                <div className="resource-value"><span>Trẻ em</span><strong data-testid="child-count">{living.filter((c) => c.age < 18).length}</strong></div>
                <div className="resource-value"><span>Sức khỏe bình quân</span><strong data-testid="average-health">{averageHealth}/100</strong></div>
                <div className="resource-value"><span>Food sản xuất / ngày</span><strong data-testid="food-produced">{world.stats.foodProducedToday}</strong></div>
                <div className="resource-value"><span>Food tiêu thụ / ngày</span><strong data-testid="food-consumed">{world.stats.foodConsumedToday}</strong></div>
                <div className="resource-value"><span>Số ngày dự trữ ước tính</span><strong data-testid="food-runway">{runway}</strong></div>
                <div className="resource-value"><span>NPC đang đói</span><strong data-testid="hungry-count">{hungry}</strong></div>
                <div className="resource-value"><span>NPC sức khỏe nguy hiểm</span><strong data-testid="danger-count">{endangered}</strong></div>
              </div>
              <p className="dashboard-note">Kho hiển thị thuộc sở hữu chợ; hàng NPC giữ trong túi không bị tính trùng. Mỗi giao dịch chuyển cả hàng và tiền.</p>
              <div className="hud-summary" aria-label="Tình hình làng" data-testid="hud-summary">
                <span>Ngày {day} · {String(hour).padStart(2, '0')}:00 · {living.length} người</span>
                <span>Food chợ {world.inventory.food} · dự trữ {runway}</span>
                <span>Sức khỏe {averageHealth}/100 · đang đói {hungry}</span>
                <span>{governance.shocks.length ? 'Cảnh báo: ' + governance.shocks.map(s => s.kind === 'poorHarvest' ? 'Mất mùa' : 'Dịch bệnh').join(', ') : 'Không có khủng hoảng đang diễn ra'}</span>
              </div>
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
              <label htmlFor="population-input">Dân số khi tạo thế giới</label>
              <select id="population-input" data-testid="population-input" value={populationInput} onChange={(event) => setPopulationInput(Number(event.target.value) as 20 | 50 | 100)}>
                <option value={20}>20 NPC</option><option value={50}>50 NPC</option><option value={100}>100 NPC</option>
              </select>
              <section className="save-panel" aria-label="Lưu và khôi phục thế giới">
                <h4>Lưu &amp; khôi phục</h4>
                <p className="dashboard-note">Bản lưu localStorage chỉ ở trình duyệt và thiết bị hiện tại, không phải cloud save. Tạo thế giới mới không xóa bản lưu cũ, nhưng lần lưu tiếp theo sẽ ghi đè. Xuất JSON để giữ bản sao độc lập.</p>
                <div className="save-actions">
                  <button type="button" className="ghost-button" data-testid="save-world" onClick={saveToBrowser}>Lưu thế giới</button>
                  <button type="button" className="ghost-button" data-testid="load-world" onClick={loadFromBrowser}>Tải bản lưu</button>
                  <button type="button" className="ghost-button" data-testid="export-world" onClick={exportJson}>Xuất JSON</button>
                  <label className="import-button" htmlFor="import-world">Nhập JSON</label>
                  <input id="import-world" type="file" data-testid="import-world" accept=".json,application/json" onChange={event => {
                    const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
                    void importJson(file);
                  }} />
                </div>
                <p data-testid="save-status" role="status" aria-live="polite" className="save-status">{saveMessage}</p>
                {saveTick !== null && <p className="dashboard-note">Snapshot gần nhất thao tác: tick {saveTick}</p>}
              </section>
              <p className="dashboard-note">Bản MVP thử nghiệm: một làng, 20/50/100 NPC, kinh tế và quản trị giản lược, ưu tiên desktop. Không có multiplayer hay đồng bộ đám mây. <a href="https://github.com/giabao2605/Tiny-Civilization/issues" target="_blank" rel="noopener noreferrer">Báo lỗi trên GitHub</a>.</p>
              <p className="debug-line" data-testid="world-tick">Tick {world.tick} · Seed {world.seed}{import.meta.env.DEV ? ' · #' + stateDigest(world) : ''}</p>
            </section>

            <section className="side-card" data-testid="governance-panel" aria-label="Village Governance">
              <p className="section-kicker">VILLAGE GOVERNANCE · QUẢN TRỊ LÀNG</p>
              <h3>Trưởng làng & khủng hoảng</h3>
              <dl className="info-list">
                <dt>Trưởng làng</dt><dd data-testid="governance-leader">{leader ? <button type="button" className="text-button" onClick={() => coordinator.dispatch({ type: 'select-citizen', id: leader.id })}>{leader.name} · NPC #{leader.id}</button> : 'Khuyết chức'}</dd>
                <dt>Nhiệm kỳ</dt><dd>Tick {governance.termStartedTick} đến {governance.nextElectionTick}</dd>
                <dt>Điểm ủng hộ</dt><dd>{governance.leaderSupport} · Uy tín {governance.reputation}/100</dd>
                <dt>Vì sao được chọn?</dt><dd>{governance.selectionReason}</dd>
                <dt>Lượt chọn lãnh đạo</dt><dd data-testid="governance-elections">{governance.elections}</dd>
                <dt>Tình trạng cứu trợ</dt><dd data-testid="food-aid-status">{governance.policy.activeUntil > world.tick
                  ? 'Đang áp dụng đến tick ' + governance.policy.activeUntil
                  : governance.policy.cooldownUntil > world.tick ? 'Cooldown đến tick ' + governance.policy.cooldownUntil
                  : 'Sẵn sàng khi đủ điều kiện'}</dd>
                <dt>Food đã chuyển</dt><dd data-testid="food-aid-transferred">{governance.policy.transferred} đơn vị từ kho chợ · {governance.policy.successes} lần thành công</dd>
                <dt>Giới hạn</dt><dd>Tối đa 6 người/lượt · 1 food/người · hiệu lực 24 giờ · cooldown 72 giờ</dd>
                <dt>Người đang bị bệnh</dt><dd data-testid="illness-count">{sick}</dd>
                <dt>Mất mùa / bệnh đã xảy ra</dt><dd>{governance.harvestCount} / {governance.illnessCount}</dd>
              </dl>
              <button type="button" className="ghost-button" data-testid="activate-food-aid"
                onClick={() => coordinator.dispatch({ type: 'trigger-food-aid' })}>Kích hoạt cứu trợ food</button>
              <p className="dashboard-note" data-testid="aid-feedback">{snapshot.lastPolicyMessage || (aidReason
                ? 'Điều kiện hiện tại: ' + aidReason : 'Có thể chuyển food từ kho chợ tới cư dân thiếu ăn trong tick tới.')}</p>
              <p className="dashboard-note" data-testid="aid-eligibility">{aidReason ? 'Chưa thể cứu trợ: ' + aidReason : 'Cứu trợ khả dụng vào tick kế tiếp nếu không có lệnh khác.'}</p>
              <h4>Biến cố đang diễn ra</h4>
              <ul className="recent-list" data-testid="active-shocks">{governance.shocks.length ? governance.shocks.map(shock =>
                <li key={shock.id}>#{shock.id} · {shock.kind === 'poorHarvest' ? 'Mất mùa' : 'Bệnh cục bộ'} ·
                  mức {shock.severity} · còn {Math.max(0, shock.endTick - world.tick)} giờ ·
                  {shock.kind === 'poorHarvest' ? ' Giảm sản lượng: ' + shock.lostProduction + ' food tiềm năng'
                    : ' ' + shock.affectedIds.length + ' người, HP giảm ' + shock.impactedHealth}
                </li>) : <li>Chưa có biến cố đang diễn ra.</li>}</ul>
              <p className="dashboard-note">Kho cứu trợ dùng trực tiếp kho food thuộc chợ; không có quỹ hoặc kho nhà nước thứ hai. Sản lượng mất và HP giảm là số đo từ engine.</p>
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
                      <dt>Bệnh cục bộ</dt><dd data-testid="citizen-illness">{citizen.alive && citizen.illnessUntil > world.tick ? 'Đang bệnh mức ' + citizen.illnessSeverity + ' đến tick ' + citizen.illnessUntil + '; năng suất giảm' : 'Không mắc bệnh'}</dd>
                      <dt>Cứu trợ gần nhất</dt><dd>{governance.policy.lastRecipients.includes(citizen.id) ? 'Đã được nhận 1 food từ kho chợ trong đợt #' + governance.policy.lastId : 'Chưa nhận trong đợt gần nhất'}</dd>
                      <dt>Nhân khẩu</dt><dd>{citizen.age < 18 ? 'Trẻ phụ thuộc' : citizen.age >= 68 ? 'Nghỉ lao động' : 'Trưởng thành'}</dd>
                      <dt>Nghề</dt><dd data-testid="citizen-job">{jobNames[citizen.job]}</dd>
                      <dt>Đang làm</dt><dd>{ACTIVITY[citizen.activity]}</dd>
                       <dt>Trạng thái đường đi</dt><dd>{citizen.route.length ? citizen.route.length + ' ô còn lại' : 'Không có tuyến đang đi'} · {citizen.alive ? citizen.reason : 'Đã kết thúc hoạt động'}</dd>
                      <dt>Vị trí</dt><dd>({citizen.tile.x}, {citizen.tile.y})</dd>
                      <dt>Nhà</dt><dd>{citizen.homeId === null ? 'Chưa có nhà' : getSite(world, citizen.homeId).name}</dd>
                      <dt>Hộ gia đình</dt><dd data-testid="citizen-household">{selectedHousehold ? '#' + selectedHousehold.id + ' · ' + selectedHousehold.members.length + ' người' : 'Chưa có hộ'}</dd>
                      <dt>Partner</dt><dd>{citizen.partnerId === null ? 'Chưa có' : <button className="text-button" type="button" onClick={() => coordinator.dispatch({ type: 'select-citizen', id: citizen.partnerId })}>{world.citizens.find((c) => c.id === citizen.partnerId)?.name}</button>}</dd>
                      <dt>Ví tiền</dt><dd data-testid="citizen-wallet">{citizen.wallet}</dd>
                      <dt>Túi đồ</dt><dd data-testid="citizen-inventory">Food {citizen.inventory.food} · Wood {citizen.inventory.wood}</dd>
                      <dt>Giao dịch gần đây</dt><dd>{market.trades.filter((trade) => trade.citizenId === citizen.id).slice(-1).map((t) => t.direction === 'buy' ? 'Mua ' + t.quantity + ' ' + t.good : 'Bán ' + t.quantity + ' ' + t.good).join('') || 'Chưa có'}</dd>
                      <dt>Nơi làm việc</dt><dd>{citizen.workNodeId !== null ? (() => { const node = world.resourceNodes.find((item) => item.id === citizen.workNodeId); return node ? (node.kind === 'field' ? 'Ruộng' : 'Rừng') + ' #' + node.id + ' (' + node.tile.x + ', ' + node.tile.y + ')' : 'Không có'; })() : getSite(world, citizen.workId).name}</dd>
                      <dt>Mục tiêu</dt><dd>{citizen.goal === 'food' ? 'Mua / ăn food' : citizen.goal === 'sell' ? 'Bán sản phẩm' : citizen.goal === 'build' ? 'Xây dựng' : citizen.goal === 'home' ? 'Trở về nhà' : citizen.goal === 'work' ? 'Đi làm' : 'Gặp gỡ cộng đồng'}</dd>
                      <dt>Thời gian hành động</dt><dd>{citizen.actionDuration ? citizen.actionDuration + ' giờ; tiến độ ' + citizen.workHours + ' giờ' : 'Không có'}</dd>
                      <dt>Điểm đến</dt><dd>({citizen.destination.x}, {citizen.destination.y})</dd>
                    </dl>
                    <div className="social-panel" data-testid="social-inspector">
                      <p className="recent-title">Quan hệ nổi bật</p>
                      {ties.length ? <ul className="relationship-list">{ties.map(({ other, tie }) => <li key={other!.id}>
                        <button type="button" data-testid={'relation-' + other!.id} className="text-button" onClick={() => coordinator.dispatch({ type: 'select-citizen', id: other!.id })}>{other!.name}</button>
                        <span>{tie.affinity >= 0 ? '+' : ''}{tie.affinity} thiện cảm · {tie.trust} tin tưởng</span>
                        <small>{tie.reason} (tick {tie.lastTick})</small>
                      </li>)}</ul> : <p>Chưa có tương tác trực tiếp.</p>}
                      {selectedHousehold && <><p className="recent-title">Thành viên hộ</p><div className="household-members">{selectedHousehold.members.filter((id) => id !== citizen.id).map((id) => <button type="button" className="text-button" key={id} onClick={() => coordinator.dispatch({ type: 'select-citizen', id })}>{world.citizens.find((c) => c.id === id)?.name}</button>)}</div></>}
                      <p className="recent-title">Diễn biến xã hội gần đây</p>
                      <ul className="recent-list">{world.events.filter((e) => SOCIAL_TYPES.has(e.type) &&
                        (e.citizenId === citizen.id || e.targetCitizenId === citizen.id)).slice(-3).reverse().map((e) => <li key={e.id}>Tick {e.tick} · {e.reason}</li>)}</ul>
                      {!citizen.alive && <p data-testid="citizen-memorial">Tưởng niệm: {world.memorials.find((m) => m.citizenId === citizen.id)?.cause ?? citizen.reason}</p>}
                    </div>
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
              <h3>{living.length}/{world.citizens.length} cư dân còn sống</h3>
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

            <section className="side-card" aria-label="Chợ và công trình">
              <p className="section-kicker">MARKET & CONSTRUCTION</p>
              <h3>Chợ trung tâm và nhà ở</h3>
              <div className="resource-dashboard" data-testid="market-inspector">
                <div className="resource-value"><span>Giá food (chợ mua / bán)</span><strong>{market.prices.foodBuy} / {market.prices.foodSell}</strong></div>
                <div className="resource-value"><span>Giá wood (chợ mua / bán)</span><strong>{market.prices.woodBuy} / {market.prices.woodSell}</strong></div>
                <div className="resource-value"><span>Food / Wood thuộc chợ</span><strong>{world.inventory.food} / {world.inventory.wood}</strong></div>
              </div>
              <h4>Công trình</h4>
              <ul className="recent-list" data-testid="construction-list">{activeSites.length ? activeSites.map((site) => <li key={site.id}>Nhà #{site.id} tại ({site.tile.x}, {site.tile.y}) · {site.progress}/{site.hoursRequired} giờ · Đã dùng {site.woodSpent} wood</li>) : <li>Chưa có công trình đang xây</li>}</ul>
              <h4>Giao dịch gần đây</h4>
              <ul className="recent-list" data-testid="trade-history">{market.trades.slice(-5).reverse().map((trade, index) => <li key={trade.tick + ':' + trade.citizenId + ':' + index}>Tick {trade.tick} · NPC #{trade.citizenId} {trade.direction === 'buy' ? 'mua' : 'bán'} {trade.quantity} {trade.good} · {trade.amount} tiền</li>)}</ul>
            </section>

            <section className="side-card event-card">
              <p className="section-kicker">LIVING HISTORY</p>
              <h3>10 sự kiện gần nhất</h3>
              <label htmlFor="timeline-filter">Lọc dòng sự kiện</label>
              <select id="timeline-filter" data-testid="timeline-filter" value={timelineCategory} onChange={(e) => setTimelineCategory(e.target.value as TimelineCategory)}>
                <option value="all">Tất cả</option><option value="social">Social</option><option value="economy">Economy</option><option value="survival">Survival</option><option value="governance">Governance</option>
              </select>
              {inspectedEvent && <div className="social-panel" data-testid="crisis-event-details">
                <p className="recent-title">Hồ sơ sự kiện #{inspectedEvent.id} · Tick {inspectedEvent.tick}</p>
                <p>{inspectedEvent.reason}</p>
                <p>Nguyên nhân: {inspectedEvent.cause ?? 'Diễn biến trực tiếp trong mô phỏng.'}
                  {inspectedEvent.shockId !== undefined && ' · Shock #' + inspectedEvent.shockId}
                  {inspectedEvent.policyId !== undefined && ' · Policy #' + inspectedEvent.policyId}</p>
                {inspectedNode && <p>Vị trí ruộng/nguồn #{inspectedNode.id}: ({inspectedNode.tile.x}, {inspectedNode.tile.y})</p>}
                {inspectedEvent.before !== undefined && inspectedEvent.after !== undefined &&
                  <p>Trước / sau: {inspectedEvent.before} → {inspectedEvent.after}</p>}
                {inspectedEvent.citizenId !== null && <button type="button" className="text-button" onClick={() =>
                  coordinator.dispatch({ type: 'select-citizen', id: inspectedEvent.citizenId })}>Xem NPC #{inspectedEvent.citizenId}</button>}
              </div>}
              <ol className="event-feed" data-testid="event-feed">
                {visibleEvents.map((event) => (
                  <li key={event.id} className={'event-' + EVENT_LEVEL[event.type]}>
                    <span>Ngày {dayOf(event.tick)} · {String(hourOf(event.tick)).padStart(2, '0')}:00 · {EVENTS[event.type]}</span>
                    <p>{event.reason}</p>
                    {GOVERNANCE_TYPES.has(event.type) && <button type="button" className="text-button" onClick={() => setInspectedEventId(event.id)}>Xem nguyên nhân #{event.id}</button>}
                    {event.citizenId !== null && <button type="button" className="text-button" onClick={() => coordinator.dispatch({ type: 'select-citizen', id: event.citizenId })}>NPC #{event.citizenId}</button>}
                    {event.nodeId !== undefined && <span> Ruộng/nguồn #{event.nodeId}</span>}
                    {event.shockId !== undefined && <span> · Shock #{event.shockId}</span>}
                    {event.policyId !== undefined && <span> · Policy #{event.policyId}</span>}
                    {event.before !== undefined && event.after !== undefined && <span> · {event.before} → {event.after}</span>}
                    {event.targetCitizenId !== undefined && <button type="button" className="text-button" onClick={() => coordinator.dispatch({ type: 'select-citizen', id: event.targetCitizenId! })}>NPC #{event.targetCitizenId}</button>}
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>

      <footer className="site-footer"><span>TINY CIVILIZATION / MVP RC 0.9.0 · SAVE {ENGINE_VERSION}</span><span>20/50/100 NPC · Lãnh đạo · Mất mùa · Bệnh cục bộ</span></footer>
    </div>
  );
}
