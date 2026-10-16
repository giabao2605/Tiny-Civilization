/**
 * W02-D isolated layout metadata for the future 96x96 world.
 * No new economic entities, gameplay movement rules, visual engine or save format.
 * Generation is authored + seed-stable, and does not consume economic/world RNG.
 */
import { isValidTileAt, tileIndexAt, type TilePosition, type WorldDimensions } from './grid';
import type { ResourceNode, Site, Terrain } from './world';

export type District96Id = 'residential' | 'civic' | 'nature';
export type Road96Kind = 'main' | 'side' | 'footpath' | 'plaza';
export type Poi96Role = 'decorative' | 'event';
export type Poi96Kind =
  | 'garden' | 'well' | 'laundry' | 'fence' | 'bench' | 'vegetable-patch'
  | 'lantern' | 'courtyard' | 'stall' | 'cart' | 'notice-board'
  | 'fountain' | 'shade-tree' | 'market-sign' | 'flowerbed' | 'flag'
  | 'viewpoint' | 'reeds' | 'wildflowers' | 'rocks' | 'fallen-log' | 'birdwatch';
export type Road96Cell = { tile: TilePosition; kind: Road96Kind };
export type Entrance96 = { siteId: number; tile: TilePosition };
export type Poi96 = {
  id: string; kind: Poi96Kind; districtId: District96Id;
  tile: TilePosition; role: Poi96Role; label: string;
};
export type District96 = {
  id: District96Id; label: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  hub: TilePosition;
};
export type World96Layout = {
  districts: District96[]; roads: Road96Cell[]; entrances: Entrance96[]; pois: Poi96[];
};

const DIM: WorldDimensions = Object.freeze({ width: 96, height: 96 });
const DELTAS: TilePosition[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
const ROAD_KINDS: readonly Road96Kind[] = ['main', 'side', 'footpath', 'plaza'];
const POI_KINDS: readonly Poi96Kind[] = [
  'garden', 'well', 'laundry', 'fence', 'bench', 'vegetable-patch', 'lantern',
  'courtyard', 'stall', 'cart', 'notice-board', 'fountain', 'shade-tree',
  'market-sign', 'flowerbed', 'flag', 'viewpoint', 'reeds', 'wildflowers',
  'rocks', 'fallen-log', 'birdwatch',
];
const DISTRICTS: District96[] = [
  { id: 'residential', label: 'Khu dân cư', bounds: { minX: 10, maxX: 40, minY: 14, maxY: 76 },
    hub: { x: 40, y: 46 } },
  { id: 'civic', label: 'Trung tâm và chợ', bounds: { minX: 41, maxX: 70, minY: 31, maxY: 62 },
    hub: { x: 57, y: 46 } },
  { id: 'nature', label: 'Rừng và bờ hồ', bounds: { minX: 71, maxX: 95, minY: 0, maxY: 95 },
    hub: { x: 73, y: 83 } },
];
const ANCHORS: ReadonlyArray<{
  kind: Poi96Kind; districtId: District96Id; x: number; y: number; role: Poi96Role; label: string;
}> = [
  { kind: 'garden', districtId: 'residential', x: 15, y: 19, role: 'decorative', label: 'Vườn hoa đầu phố' },
  { kind: 'well', districtId: 'residential', x: 23, y: 21, role: 'event', label: 'Giếng làng' },
  { kind: 'laundry', districtId: 'residential', x: 31, y: 28, role: 'decorative', label: 'Sân phơi áo' },
  { kind: 'fence', districtId: 'residential', x: 36, y: 43, role: 'decorative', label: 'Hàng rào thấp' },
  { kind: 'bench', districtId: 'residential', x: 16, y: 50, role: 'event', label: 'Ghế nghỉ bên đường' },
  { kind: 'vegetable-patch', districtId: 'residential', x: 24, y: 58, role: 'decorative', label: 'Luống rau' },
  { kind: 'lantern', districtId: 'residential', x: 34, y: 69, role: 'decorative', label: 'Đèn phố nhỏ' },
  { kind: 'courtyard', districtId: 'residential', x: 18, y: 70, role: 'event', label: 'Sân sinh hoạt' },
  { kind: 'stall', districtId: 'civic', x: 46, y: 41, role: 'decorative', label: 'Quầy chợ' },
  { kind: 'cart', districtId: 'civic', x: 51, y: 42, role: 'decorative', label: 'Xe đẩy hàng' },
  { kind: 'notice-board', districtId: 'civic', x: 66, y: 40, role: 'event', label: 'Bảng tin' },
  { kind: 'fountain', districtId: 'civic', x: 60, y: 51, role: 'decorative', label: 'Đài nước' },
  { kind: 'shade-tree', districtId: 'civic', x: 46, y: 51, role: 'decorative', label: 'Cây bóng mát' },
  { kind: 'market-sign', districtId: 'civic', x: 67, y: 52, role: 'decorative', label: 'Biển chợ' },
  { kind: 'flowerbed', districtId: 'civic', x: 54, y: 58, role: 'decorative', label: 'Bồn hoa' },
  { kind: 'flag', districtId: 'civic', x: 61, y: 58, role: 'event', label: 'Cột cờ hội họp' },
  { kind: 'viewpoint', districtId: 'nature', x: 73, y: 24, role: 'event', label: 'Điểm ngắm hồ bắc' },
  { kind: 'reeds', districtId: 'nature', x: 76, y: 36, role: 'decorative', label: 'Bờ lau sậy' },
  { kind: 'wildflowers', districtId: 'nature', x: 90, y: 17, role: 'decorative', label: 'Hoa rừng' },
  { kind: 'rocks', districtId: 'nature', x: 92, y: 38, role: 'decorative', label: 'Cụm đá ven hồ' },
  { kind: 'fallen-log', districtId: 'nature', x: 74, y: 60, role: 'decorative', label: 'Gốc cây đổ' },
  { kind: 'bench', districtId: 'nature', x: 75, y: 71, role: 'event', label: 'Ghế ven hồ nam' },
  { kind: 'birdwatch', districtId: 'nature', x: 83, y: 88, role: 'event', label: 'Bãi ngắm chim' },
  { kind: 'viewpoint', districtId: 'nature', x: 90, y: 80, role: 'event', label: 'Đồi ngắm rừng' },
];

function key(p: TilePosition): string { return p.x + ',' + p.y; }
function assertValid(ok: unknown, reason: string): asserts ok {
  if (!ok) throw new Error('Invalid W02-D layout: ' + reason);
}
function roadKind(p: TilePosition): Road96Kind {
  if (p.x >= 53 && p.x <= 61 && p.y >= 43 && p.y <= 49) return 'plaza';
  if ((p.y === 46 && p.x >= 11 && p.x <= 70) ||
    (p.x === 40 && p.y >= 15 && p.y <= 75) ||
    (p.x === 57 && p.y >= 31 && p.y <= 62) ||
    (p.x === 70 && p.y >= 7 && p.y <= 83)) return 'main';
  if ((p.x <= 70 && (p.y === 31 || p.y === 38 || p.y === 55 || p.y === 62)) ||
    (p.x === 11 && p.y >= 15 && p.y <= 75) ||
    (p.x <= 40 && [15, 25, 35, 65, 75].includes(p.y))) return 'side';
  return 'footpath';
}

/** Appends authored shortcuts to W02-C's roads without touching lakes or gameplay costs. */
function addStreets(tiles: Terrain[]): void {
  const road = (x: number, y: number): void => {
    const index = tileIndexAt({ x, y }, DIM);
    assertValid(index !== null && tiles[index] !== 'water', 'authored street on water or out of bounds');
    tiles[index] = 'road';
  };
  const horizontal = (y: number, a: number, b: number): void => {
    for (let x = a; x <= b; x += 1) road(x, y);
  };
  const vertical = (x: number, a: number, b: number): void => {
    for (let y = a; y <= b; y += 1) road(x, y);
  };
  // Two extra cross-town connections plus local residential alleys.
  horizontal(38, 40, 70);
  horizontal(55, 11, 57);
  vertical(21, 15, 35);
  vertical(32, 35, 65);
  // Civic pedestrian plaza: actual road tiles (not a fake passable overlay).
  for (let y = 43; y <= 49; y += 1) horizontal(y, 53, 61);
  // An alternate waterfront approach around the southern park.
  horizontal(75, 70, 73);
  vertical(73, 75, 83);
}

function placeEntrance(site: Site, roads: ReadonlySet<string>, occupied: Set<string>): Entrance96 {
  for (const delta of DELTAS) {
    const tile = { x: site.tile.x + delta.x, y: site.tile.y + delta.y };
    if (roads.has(key(tile)) && !occupied.has(key(tile))) {
      occupied.add(key(tile));
      return { siteId: site.id, tile };
    }
  }
  throw new Error('No non-overlapping road entrance for site ' + site.id);
}

function placePois(seed: number, tiles: readonly Terrain[], occupied: Set<string>): Poi96[] {
  const pois: Poi96[] = [];
  for (let index = 0; index < ANCHORS.length; index += 1) {
    const base = ANCHORS[index]!;
    const district = DISTRICTS.find(value => value.id === base.districtId)!;
    // Local seed variation, no RNG state consumption and no unbounded retry.
    const skew = ((Math.imul(seed | 0, 1103515245) + index * 2654435761) >>> 0) % 4;
    const offsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    const ordered = [...offsets.slice(skew), ...offsets.slice(0, skew)];
    let chosen: TilePosition | null = null;
    for (const [dx, dy] of ordered) {
      const tile = { x: base.x + dx!, y: base.y + dy! };
      const n = tileIndexAt(tile, DIM);
      if (n === null || tile.x < district.bounds.minX || tile.x > district.bounds.maxX ||
        tile.y < district.bounds.minY || tile.y > district.bounds.maxY ||
        tiles[n] === 'water' || tiles[n] === 'road' || occupied.has(key(tile))) continue;
      chosen = tile;
      break;
    }
    assertValid(chosen !== null, 'cannot place POI ' + index);
    occupied.add(key(chosen));
    pois.push({
      id: 'poi-' + String(index + 1).padStart(2, '0'), kind: base.kind, districtId: base.districtId,
      role: base.role, label: base.label, tile: chosen,
    });
  }
  return pois;
}

/** Mutates only the new 96 terrain buffer before publication; never a live world. */
export function buildWorld96Layout(seed: number, tiles: Terrain[], sites: readonly Site[],
  resourceNodes: readonly ResourceNode[]): World96Layout {
  assertValid(tiles.length === 9216, 'tile count');
  addStreets(tiles);
  const roads: Road96Cell[] = [];
  for (let y = 0; y < DIM.height; y += 1) for (let x = 0; x < DIM.width; x += 1) {
    if (tiles[y * DIM.width + x] === 'road') roads.push({ tile: { x, y }, kind: roadKind({ x, y }) });
  }
  const roadSet = new Set(roads.map(record => key(record.tile)));
  const occupied = new Set([...sites, ...resourceNodes].map(item => key(item.tile)));
  const entrances = sites.map(site => placeEntrance(site, roadSet, occupied));
  const pois = placePois(seed, tiles, occupied);
  return { districts: DISTRICTS.map(d => ({ ...d, hub: { ...d.hub }, bounds: { ...d.bounds } })),
    roads, entrances, pois };
}

/**
 * A road-only BFS for layout QA. Does not replace the engine's findPath:
 * grass/forest remain walkable under the real, unchanged movement rules.
 */
export function roadOnlyPath(layout: World96Layout, origin: TilePosition, target: TilePosition,
  blocked?: TilePosition): TilePosition[] | null {
  const roads = new Set(layout.roads.map(road => key(road.tile)));
  const start = key(origin);
  const end = key(target);
  if (!roads.has(start) || !roads.has(end)) return null;
  const denied = blocked === undefined ? '' : key(blocked);
  if (denied === start || denied === end) return null;
  const queue = [origin];
  const prev = new Map<string, string>();
  prev.set(start, start);
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]!;
    const currentKey = key(current);
    if (currentKey === end) {
      const route: TilePosition[] = [];
      for (let at = end; at !== start; at = prev.get(at)!) {
        const [x, y] = at.split(',').map(Number);
        route.push({ x: x!, y: y! });
      }
      return route.reverse();
    }
    for (const dir of DELTAS) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      const name = key(next);
      if (!roads.has(name) || name === denied || prev.has(name)) continue;
      prev.set(name, currentKey);
      queue.push(next);
    }
  }
  return null;
}

export type World96LayoutSource = {
  seed: number; map: WorldDimensions; tiles: readonly Terrain[];
  sites: readonly Site[]; resourceNodes: readonly ResourceNode[]; layout: World96Layout;
};
export const ROAD_BACKUP_CASES: ReadonlyArray<{
  from: TilePosition; to: TilePosition; obstruction: TilePosition;
}> = [
  { from: { x: 40, y: 46 }, to: { x: 57, y: 46 }, obstruction: { x: 45, y: 46 } },
  { from: { x: 57, y: 46 }, to: { x: 73, y: 83 }, obstruction: { x: 70, y: 79 } },
];

/** Structural, referential, walkability, determinism and road-graph validation. */
export function validateWorld96Layout(world: World96LayoutSource): void {
  const layout = world.layout;
  assertValid(world.map.width === 96 && world.map.height === 96 && world.tiles.length === 9216,
    'world dimensions');
  assertValid(layout !== null && typeof layout === 'object' && Array.isArray(layout.districts) &&
    Array.isArray(layout.roads) && Array.isArray(layout.entrances) && Array.isArray(layout.pois), 'layout shape');
  const ids = layout.districts.map(d => d.id);
  assertValid(ids.length === 3 && new Set(ids).size === 3 &&
    ['residential', 'civic', 'nature'].every(id => ids.includes(id as District96Id)), 'district IDs');
  for (const district of layout.districts) {
    const { minX, maxX, minY, maxY } = district.bounds;
    assertValid(typeof district.label === 'string' && district.label.length > 0 &&
      [minX, minY, maxX, maxY].every(Number.isSafeInteger) &&
      isValidTileAt({ x: minX, y: minY }, DIM) && isValidTileAt({ x: maxX, y: maxY }, DIM) &&
      minX <= maxX && minY <= maxY && isValidTileAt(district.hub, DIM), 'district geometry');
  }
  const roadPositions = new Set<string>();
  for (const road of layout.roads) {
    const index = tileIndexAt(road.tile, DIM);
    assertValid(index !== null && world.tiles[index] === 'road' &&
      ROAD_KINDS.includes(road.kind) && !roadPositions.has(key(road.tile)), 'road metadata');
    roadPositions.add(key(road.tile));
  }
  assertValid(layout.roads.length === world.tiles.filter(tile => tile === 'road').length &&
    ROAD_KINDS.every(kind => layout.roads.some(road => road.kind === kind)), 'road coverage/hierarchy');
  const siteIds = new Set(world.sites.map(site => site.id));
  const occupied = new Set([...world.sites, ...world.resourceNodes].map(value => key(value.tile)));
  const entranceIds = new Set<number>();
  assertValid(layout.entrances.length === world.sites.length, 'entrance count');
  for (const entrance of layout.entrances) {
    const site = world.sites.find(value => value.id === entrance.siteId);
    const index = tileIndexAt(entrance.tile, DIM);
    assertValid(site !== undefined && siteIds.has(entrance.siteId) &&
      !entranceIds.has(entrance.siteId) && index !== null &&
      world.tiles[index] === 'road' && !occupied.has(key(entrance.tile)) &&
      Math.abs(entrance.tile.x - site.tile.x) + Math.abs(entrance.tile.y - site.tile.y) === 1,
    'entrance placement/reference');
    entranceIds.add(entrance.siteId);
    occupied.add(key(entrance.tile));
  }
  const poiIds = new Set<string>();
  assertValid(layout.pois.length >= 20, 'POI count');
  for (const poi of layout.pois) {
    const district = layout.districts.find(value => value.id === poi.districtId);
    const index = tileIndexAt(poi.tile, DIM);
    assertValid(typeof poi.id === 'string' && /^poi-\d{2}$/.test(poi.id) &&
      !poiIds.has(poi.id) && POI_KINDS.includes(poi.kind) &&
      (poi.role === 'decorative' || poi.role === 'event') &&
      typeof poi.label === 'string' && poi.label.length > 0 &&
      index !== null && world.tiles[index] !== 'water' && world.tiles[index] !== 'road' &&
      district !== undefined && poi.tile.x >= district.bounds.minX && poi.tile.x <= district.bounds.maxX &&
      poi.tile.y >= district.bounds.minY && poi.tile.y <= district.bounds.maxY &&
      !occupied.has(key(poi.tile)), 'POI geometry/identity');
    poiIds.add(poi.id);
    occupied.add(key(poi.tile));
  }
  for (const pair of ROAD_BACKUP_CASES) {
    assertValid(roadOnlyPath(layout, pair.from, pair.to) !== null &&
      roadOnlyPath(layout, pair.from, pair.to, pair.obstruction) !== null, 'road backup broken');
  }
  // Regenerate solely from the seed and published terrain, without consuming PRNG.
  const checkTiles = [...world.tiles];
  const expected = buildWorld96Layout(world.seed, checkTiles, world.sites, world.resourceNodes);
  assertValid(JSON.stringify(layout) === JSON.stringify(expected) &&
    checkTiles.every((tile, i) => tile === world.tiles[i]), 'non-deterministic layout metadata');
}
