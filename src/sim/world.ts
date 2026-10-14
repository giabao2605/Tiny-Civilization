import { GRID_HEIGHT, GRID_WIDTH, tileIndex, type TilePosition } from './grid';
import { drawInt, normalizeSeed } from './prng';

export type Terrain = 'grass' | 'forest' | 'water' | 'road';
export type SiteKind = 'home' | 'work' | 'commons';
export type Goal = 'home' | 'work' | 'commons';
export type Activity = 'rest' | 'travelToWork' | 'atWork' | 'travelToCommons' | 'socialIdle' | 'travelHome';
export type EventType = 'founded' | 'departure' | 'work' | 'gather' | 'home' | 'routeBlocked';
export type Site = { id: number; name: string; kind: SiteKind; tile: TilePosition };
export type ActivityEntry = { tick: number; activity: Activity; reason: string };
export type Citizen = {
  id: number;
  name: string;
  age: number;
  appearance: number;
  alive: true;
  tile: TilePosition;
  homeId: number;
  workId: number;
  goal: Goal;
  destination: TilePosition;
  reason: string;
  activity: Activity;
  route: TilePosition[];
  lastMove: TilePosition[];
  blockedGoal: Goal | null;
  retryAfterTick: number;
  recent: ActivityEntry[];
};
export type WorldEvent = { id: number; tick: number; type: EventType; citizenId: number | null; reason: string };
export type WorldState = {
  schemaVersion: 1;
  seed: number;
  rngState: number;
  tick: number;
  nextEntityId: number;
  nextEventId: number;
  tiles: Terrain[];
  sites: Site[];
  citizens: Citizen[];
  events: WorldEvent[];
};

const FORENAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hương', 'Khánh', 'Lan', 'Linh', 'Mai', 'Minh', 'Nam', 'Ngọc', 'Phúc', 'Quân', 'Thảo', 'Trang', 'Vân'];
const SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi'];
const CENTER = { x: 24, y: 24 };
const homePositions: TilePosition[] = [14, 18, 30, 34].flatMap((y) => [13, 18, 23, 28, 33].map((x) => ({ x, y })));
const workPositions: TilePosition[] = [
  { x: 12, y: 20 }, { x: 18, y: 20 }, { x: 30, y: 20 },
  { x: 18, y: 29 }, { x: 32, y: 29 },
];

export function getSite(world: WorldState, id: number): Site {
  const site = world.sites.find((item) => item.id === id);
  if (!site) throw new Error('Missing site ' + id);
  return site;
}

export function walkable(world: Pick<WorldState, 'tiles'>, tile: TilePosition): boolean {
  const index = tileIndex(tile);
  return index !== null && world.tiles[index] !== 'water';
}

export function createWorld(seed = 12345): WorldState {
  let rngState = normalizeSeed(seed);
  const draw = (max: number) => {
    const result = drawInt(rngState, max);
    rngState = result.state;
    return result.value;
  };
  const tiles: Terrain[] = [];
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const lake = ((x - 8) ** 2) / 38 + ((y - 9) ** 2) / 23 < 1;
      const pond = ((x - 40) ** 2) / 23 + ((y - 40) ** 2) / 14 < 1;
      const detail = draw(100);
      tiles.push(lake || pond ? 'water' : detail < 24 ? 'forest' : 'grass');
    }
  }
  // Carve an always-connected small settlement, including walkable site anchors.
  const setRoad = (x: number, y: number) => { tiles[y * GRID_WIDTH + x] = 'road'; };
  const connect = (target: TilePosition) => {
    const minX = Math.min(target.x, CENTER.x);
    const maxX = Math.max(target.x, CENTER.x);
    for (let x = minX; x <= maxX; x += 1) setRoad(x, target.y);
    const minY = Math.min(target.y, CENTER.y);
    const maxY = Math.max(target.y, CENTER.y);
    for (let y = minY; y <= maxY; y += 1) setRoad(CENTER.x, y);
  };
  const sites: Site[] = [];
  let nextEntityId = 1;
  for (let i = 0; i < homePositions.length; i += 1) {
    const tile = homePositions[i]!;
    connect(tile);
    sites.push({ id: nextEntityId++, kind: 'home', name: 'Nhà ' + (i + 1), tile });
  }
  const jobs = ['Vườn ươm', 'Xưởng gỗ', 'Tiệm thủ công', 'Trạm tuần tra', 'Kho cộng đồng'];
  for (let i = 0; i < workPositions.length; i += 1) {
    const tile = workPositions[i]!;
    connect(tile);
    sites.push({ id: nextEntityId++, kind: 'work', name: jobs[i]!, tile });
  }
  connect(CENTER);
  sites.push({ id: nextEntityId++, kind: 'commons', name: 'Quảng trường', tile: CENTER });

  const citizens: Citizen[] = [];
  for (let i = 0; i < 20; i += 1) {
    const home = sites[i]!;
    const work = sites[20 + (i % 5)]!;
    const name = SURNAMES[draw(SURNAMES.length)]! + ' ' + FORENAMES[i]!;
    citizens.push({
      id: nextEntityId++,
      name,
      age: 18 + draw(45),
      appearance: draw(8),
      alive: true,
      tile: { ...home.tile },
      homeId: home.id,
      workId: work.id,
      goal: 'home',
      destination: { ...home.tile },
      reason: 'Đang ở nhà trước giờ làm việc.',
      activity: 'rest',
      route: [],
      lastMove: [{ ...home.tile }],
      blockedGoal: null,
      retryAfterTick: 0,
      recent: [{ tick: 0, activity: 'rest', reason: 'Bắt đầu ngày mới tại nhà.' }],
    });
  }
  return {
    schemaVersion: 1,
    seed,
    rngState,
    tick: 0,
    nextEntityId,
    nextEventId: 2,
    tiles,
    sites,
    citizens,
    events: [{ id: 1, tick: 0, type: 'founded', citizenId: null, reason: 'Ngôi làng được thành lập với 20 cư dân.' }],
  };
}
