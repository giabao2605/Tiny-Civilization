import { GRID_HEIGHT, GRID_WIDTH, LEGACY_DIMENSIONS, tileIndexAt, type TilePosition, type WorldDimensions } from './grid';
import { drawInt, normalizeSeed } from './prng';
import { BALANCE } from './balance';

export type Terrain = 'grass' | 'forest' | 'water' | 'road';
export type SiteKind = 'home' | 'work' | 'commons' | 'market';
export type Goal = 'home' | 'work' | 'commons' | 'food' | 'sell' | 'build';
export type Activity = 'rest' | 'travelToWork' | 'atWork' | 'travelToCommons' | 'socialIdle'
  | 'travelHome' | 'travelToFood' | 'eating' | 'waitingForFood' | 'dead'
  | 'travelToMarket' | 'trading' | 'travelToBuild' | 'building';
export type EventType = 'founded' | 'departure' | 'work' | 'gather' | 'home' | 'routeBlocked'
  | 'foodProduced' | 'woodProduced' | 'foodEaten' | 'shortage' | 'depleted' | 'recovery'
  | 'danger' | 'death' | 'sold' | 'bought' | 'bankrupt' | 'marketEmpty'
  | 'marketInsolvent' | 'constructionStarted' | 'constructionDone' | 'constructionShortage'
  | 'unemployed' | 'homeless' | 'encounter' | 'friendship' | 'dispute' | 'rivalry'
  | 'householdFormed' | 'birth' | 'socialAvoid' | 'leaderChosen' | 'leaderVacant'
  | 'foodAid' | 'foodAidDenied' | 'shockStarted' | 'shockImpact' | 'shockEnded' | 'illnessRecovered';
export type Site = { id: number; name: string; kind: SiteKind; tile: TilePosition; capacity?: number };
export type ActivityEntry = { tick: number; activity: Activity; reason: string };
export type Job = 'farmer' | 'woodcutter' | 'builder' | 'other';
export type Goods = { food: number; wood: number };
export type Good = keyof Goods;
export type ResourceNode = {
  id: number; kind: 'field' | 'forest'; tile: TilePosition;
  stock: number; capacity: number; regenerationPerDay: number;
};
export type VillageStock = Goods;
export type Trade = { tick: number; citizenId: number; good: Good; quantity: number; amount: number; direction: 'buy' | 'sell' };
export type Market = {
  siteId: number; cash: number; initialSupply: number;
  prices: { foodBuy: number; foodSell: number; woodBuy: number; woodSell: number };
  trades: Trade[]; completedTrades: number; volumeToday: number; volumeYesterday: number;
  boughtFromCitizens: number; soldToCitizens: number;
};
export type Construction = {
  id: number; tile: TilePosition; woodSpent: number; hoursRequired: number; progress: number;
  builderId: number | null; status: 'active' | 'complete';
};
export type VillageStats = {
  day: number; foodProducedToday: number; foodConsumedToday: number;
  foodProducedYesterday: number; foodConsumedYesterday: number;
  totalFoodProduced: number; totalFoodConsumed: number;
  woodProducedToday: number; totalWoodProduced: number; deaths: number; failedActions: number;
};
export type Relationship = { affinity: number; trust: number; interactions: number; positive: number;
  negative: number; firstTick: number; lastTick: number; reason: string };
export type Household = { id: number; homeId: number; members: number[]; formedTick: number; lastBirthTick: number };
export type Memorial = { citizenId: number; name: string; tick: number; cause: string };
export type SocialStats = { encounters: number; disputes: number; partnerships: number; births: number };
export type Citizen = {  
  id: number; name: string; age: number; ageHours: number; appearance: number; alive: boolean; job: Job;
  relations: Record<number, Relationship>; householdId: number | null; partnerId: number | null;
  partneredTick: number | null;
  hunger: number; energy: number; health: number; starvationHours: number;
  illnessUntil: number; illnessSeverity: number;
  needMode: 'food' | 'rest' | null; workNodeId: number | null; workHours: number; actionDuration: number;
  tile: TilePosition; homeId: number | null; workId: number;
  goal: Goal; destination: TilePosition; reason: string; activity: Activity;
  route: TilePosition[]; lastMove: TilePosition[]; blockedGoal: Goal | null;
  retryAfterTick: number; recent: ActivityEntry[];
  wallet: number; inventory: Goods; lastTradeTick: number; jobChangedTick: number;
};
export type WorldEvent = { id: number; tick: number; type: EventType; citizenId: number | null; reason: string;
  targetCitizenId?: number; cause?: string; relationBefore?: number; relationAfter?: number;
  shockId?: number; policyId?: number; nodeId?: number; before?: number; after?: number; success?: boolean };
export type VillageShock = {
  id: number; kind: 'poorHarvest' | 'localIllness'; startTick: number; endTick: number;
  severity: number; affectedIds: number[]; lostProduction: number; impactedHealth: number;
};
export type GovernanceState = {
  leaderId: number | null; termStartedTick: number; nextElectionTick: number;
  leaderSupport: number; selectionReason: string; reputation: number;
  elections: number; leadershipChanges: number; history: { tick: number; leaderId: number | null; reason: string }[];
  policy: { activeUntil: number; cooldownUntil: number; lastTick: number; lastId: number | null;
    successes: number; failures: number; transferred: number; lastRecipients: number[]; };
  shocks: VillageShock[]; lastHarvestEnd: number; lastIllnessEnd: number;
  harvestCount: number; illnessCount: number; illnessAffected: number; illnessRecovered: number;
};
export type WorldState = {
  schemaVersion: 5; seed: number; rngState: number; tick: number;
  nextEntityId: number; nextEventId: number; tiles: Terrain[]; sites: Site[];
  citizens: Citizen[]; resourceNodes: ResourceNode[];
  /** Market-owned physical stock, NOT an additional town copy. */
  inventory: VillageStock; market: Market; constructions: Construction[];
  stats: VillageStats; events: WorldEvent[];
  households: Household[]; memorials: Memorial[]; social: SocialStats; governance: GovernanceState;
};

/** Geometry-only shape for W02-B synthetic tests; WorldState and v5 saves remain schema 5.
 * A future v6 world will own its dimensions in `map`, never in a global variable.
 */
export type WorldGeometry = Readonly<{ schemaVersion: 5; tiles: readonly Terrain[] }> |
  Readonly<{ schemaVersion: 6; map: WorldDimensions; tiles: readonly Terrain[] }>;

export function dimensionsOf(world: WorldGeometry): WorldDimensions {
  return world.schemaVersion === 5 ? LEGACY_DIMENSIONS : world.map;
}

/** Render/scene identity: a new map footprint requires terrain and camera rebuild. */
export function worldGeometryChanged(previous: WorldGeometry, next: WorldGeometry): boolean {
  const before = dimensionsOf(previous);
  const after = dimensionsOf(next);
  return before.width !== after.width || before.height !== after.height ||
    previous.tiles.length !== next.tiles.length;
}

const FORENAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hương', 'Khánh', 'Lan', 'Linh', 'Mai', 'Minh', 'Nam', 'Ngọc', 'Phúc', 'Quân', 'Thảo', 'Trang', 'Vân'];
const SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi'];
const CENTER = { x: 24, y: 24 };
const homePositions: TilePosition[] = [14, 18, 30, 34].flatMap((y) => [13, 18, 23, 28, 33].map((x) => ({ x, y })));
const workPositions: TilePosition[] = [
  { x: 12, y: 20 }, { x: 18, y: 20 }, { x: 30, y: 20 },
  { x: 18, y: 29 }, { x: 32, y: 29 },
];
const extraFields: TilePosition[] = [
  { x: 10, y: 25 }, { x: 15, y: 26 }, { x: 20, y: 23 },
  { x: 29, y: 17 }, { x: 35, y: 25 }, { x: 28, y: 36 },
  { x: 39, y: 29 }, { x: 20, y: 37 },
];
const extraForests: TilePosition[] = [
  { x: 10, y: 32 }, { x: 36, y: 17 }, { x: 38, y: 34 },
];

export function getSite(world: WorldState, id: number | null): Site {
  const site = world.sites.find((item) => item.id === id);
  if (!site) throw new Error('Missing site ' + id);
  return site;
}
export function walkable(world: WorldGeometry, tile: TilePosition): boolean {
  const index = tileIndexAt(tile, dimensionsOf(world));
  return index !== null && index < world.tiles.length && world.tiles[index] !== 'water';
}
export function marketTile(world: WorldState): TilePosition { return getSite(world, world.market.siteId).tile; }
export function housing(world: WorldState) {
  const houses = world.sites.filter((site) => site.kind === 'home');
  const occupied = world.citizens.filter((citizen) => citizen.alive && citizen.homeId !== null).length;
  return { houses: houses.length, capacity: houses.reduce((sum, h) => sum + (h.capacity ?? 1), 0),
    occupied, homeless: world.citizens.filter((citizen) => citizen.alive && citizen.homeId === null).length };
}
export function totalCurrency(world: WorldState): number {
  return world.market.cash + world.citizens.reduce((sum, citizen) => sum + citizen.wallet, 0);
}

export function createWorld(seed = 12345, population: 20 | 50 | 100 = 20): WorldState {
  if (![20, 50, 100].includes(population)) throw new Error('Population must be 20, 50 or 100');
  let rngState = normalizeSeed(seed);
  const draw = (max: number) => {
    const result = drawInt(rngState, max);
    rngState = result.state;
    return result.value;
  };
  const tiles: Terrain[] = [];
  for (let y = 0; y < GRID_HEIGHT; y += 1) for (let x = 0; x < GRID_WIDTH; x += 1) {
    const lake = ((x - 8) ** 2) / 38 + ((y - 9) ** 2) / 23 < 1;
    const pond = ((x - 40) ** 2) / 23 + ((y - 40) ** 2) / 14 < 1;
    const detail = draw(100);
    tiles.push(lake || pond ? 'water' : detail < 24 ? 'forest' : 'grass');
  }
  const setRoad = (x: number, y: number) => { tiles[y * GRID_WIDTH + x] = 'road'; };
  const connect = (tile: TilePosition) => {
    for (let x = Math.min(tile.x, CENTER.x); x <= Math.max(tile.x, CENTER.x); x += 1) setRoad(x, tile.y);
    for (let y = Math.min(tile.y, CENTER.y); y <= Math.max(tile.y, CENTER.y); y += 1) setRoad(CENTER.x, y);
  };
  const sites: Site[] = [];
  let nextEntityId = 1;
  for (let i = 0; i < homePositions.length; i += 1) {
    const tile = homePositions[i]!;
    connect(tile);
    sites.push({ id: nextEntityId++, kind: 'home', name: 'Nhà ' + (i + 1), tile, capacity: BALANCE.houseCapacity });
  }
  const jobs = ['Ruộng phía tây', 'Rừng phía bắc', 'Ruộng phía đông', 'Rừng phía nam', 'Kho cộng đồng'];
  for (let i = 0; i < workPositions.length; i += 1) {
    const tile = workPositions[i]!;
    connect(tile);
    sites.push({ id: nextEntityId++, kind: 'work', name: jobs[i]!, tile });
  }
  connect(CENTER);
  sites.push({ id: nextEntityId++, kind: 'commons', name: 'Quảng trường', tile: CENTER });
  const citizens: Citizen[] = [];
  for (let i = 0; i < population; i += 1) {
    const home = i < homePositions.length * BALANCE.houseCapacity ? sites[i % homePositions.length]! : null;
    const work = sites[20 + (i % 5)]!;
    const name = SURNAMES[draw(SURNAMES.length)]! + ' ' + FORENAMES[i % FORENAMES.length]! + (i >= 20 ? ' ' + (Math.floor(i / 20) + 1) : '');
    const spawn = home?.tile ?? CENTER;
    const job: Job = i % 25 === 24 ? 'builder' :
      i % 5 === 1 || i % 5 === 3 ? 'woodcutter' : 'farmer';
    citizens.push({
      id: nextEntityId++, name, age: 18 + draw(45), ageHours: 0, appearance: draw(8), alive: true, job,
      relations: {}, householdId: null, partnerId: null, partneredTick: null,
      hunger: 73 + draw(18), energy: 68 + draw(20), health: 90 + draw(11),
      starvationHours: 0, illnessUntil: 0, illnessSeverity: 0, needMode: null, workNodeId: null, workHours: 0, actionDuration: 0,
      tile: { ...spawn }, homeId: home?.id ?? null, workId: work.id,
      goal: 'home', destination: { ...spawn }, reason: 'Đang nghỉ trước giờ làm việc.', activity: 'rest',
      route: [], lastMove: [{ ...spawn }], blockedGoal: null, retryAfterTick: 0,
      recent: [{ tick: 0, activity: 'rest', reason: 'Bắt đầu ngày mới.' }],
      wallet: BALANCE.initialWallet, inventory: { food: 0, wood: 0 },
      lastTradeTick: -BALANCE.tradeCooldown, jobChangedTick: -BALANCE.jobCooldown,
    });
  }
  for (const citizen of citizens) citizen.ageHours = citizen.age * BALANCE.hoursPerYear;
  // Append production sites and the market AFTER citizens, preserving Phase 01 IDs for the default 20.
  const fields = [workPositions[0]!, workPositions[2]!, ...extraFields].slice(0, Math.max(2, Math.ceil(population / 12)));
  const forests = [workPositions[1]!, workPositions[3]!, ...extraForests].slice(0, Math.max(2, Math.ceil(population / 28)));
  const resourceNodes: ResourceNode[] = [
    ...fields.map((tile) => ({ tile, kind: 'field' as const })),
    ...forests.map((tile) => ({ tile, kind: 'forest' as const })),
  ].map(({ tile, kind }) => {
    connect(tile);
    return { id: nextEntityId++, kind, tile: { ...tile },
      stock: kind === 'field' ? BALANCE.farmInitial : BALANCE.forestInitial,
      capacity: kind === 'field' ? BALANCE.farmCapacity : BALANCE.forestCapacity,
      regenerationPerDay: kind === 'field' ? BALANCE.farmRegenPerDay : BALANCE.forestRegenPerDay };
  });
  const marketPosition = { x: 25, y: 24 };
  connect(marketPosition);
  const marketId = nextEntityId++;
  sites.push({ id: marketId, name: 'Chợ trung tâm', kind: 'market', tile: marketPosition });
  const food = population === 20 ? BALANCE.initialFood : Math.round(population * 1.5);
  const wood = population === 20 ? BALANCE.initialWood : BALANCE.initialWood + Math.round(population / 10);
  const cash = population * BALANCE.initialMarketCashPerCitizen;
  // Initial residents own separate single-person households. Co-residents share a house, not a family.
  const households: Household[] = [];
  for (const citizen of citizens) if (citizen.homeId !== null) {
    const household: Household = { id: nextEntityId++, homeId: citizen.homeId,
      members: [citizen.id], formedTick: 0, lastBirthTick: -BALANCE.birthCooldownHours };
    citizen.householdId = household.id;
    households.push(household);
  }
  return {
    schemaVersion: 5, seed, rngState, tick: 0, nextEntityId, nextEventId: 2, tiles, sites,
    citizens, resourceNodes, inventory: { food, wood },
    market: { siteId: marketId, cash, initialSupply: cash + population * BALANCE.initialWallet,
      prices: { foodBuy: BALANCE.foodBuyPrice, foodSell: BALANCE.foodSellPrice,
        woodBuy: BALANCE.woodBuyPrice, woodSell: BALANCE.woodSellPrice },
      trades: [], completedTrades: 0, volumeToday: 0, volumeYesterday: 0,
      boughtFromCitizens: 0, soldToCitizens: 0 },
    constructions: [], households, memorials: [],
    social: { encounters: 0, disputes: 0, partnerships: 0, births: 0 },
    governance: { leaderId: null, termStartedTick: 0, nextElectionTick: 1,
      leaderSupport: 0, selectionReason: 'Chưa lựa chọn trưởng làng.', reputation: 50,
      elections: 0, leadershipChanges: 0, history: [],
      policy: { activeUntil: 0, cooldownUntil: 0, lastTick: -1, lastId: null,
        successes: 0, failures: 0, transferred: 0, lastRecipients: [] },
      shocks: [], lastHarvestEnd: -10000, lastIllnessEnd: -10000,
      harvestCount: 0, illnessCount: 0, illnessAffected: 0, illnessRecovered: 0 },
    stats: { day: 1, foodProducedToday: 0, foodConsumedToday: 0,
      foodProducedYesterday: 0, foodConsumedYesterday: 0, totalFoodProduced: 0, totalFoodConsumed: 0,
      woodProducedToday: 0, totalWoodProduced: 0, deaths: 0, failedActions: 0 },
    events: [{ id: 1, tick: 0, type: 'founded', citizenId: null,
      reason: 'Ngôi làng có ' + population + ' cư dân, ' + cash + ' tiền quỹ và kho hàng hữu hạn.' }],
  };
}
