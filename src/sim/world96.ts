/**
 * W02-C isolated 96x96 generation. Not imported by the production coordinator,
 * persistence or app. The v5 constructor is an economic/identity bootstrap only:
 * its tiles and coordinates are discarded, while its ownership/rules are reused.
 * Do not cast a v6 world to WorldState (v5) or serialize with save.ts before W02-E.
 */
import { BALANCE } from './balance';
import { isValidTileAt, tileIndexAt, type TilePosition, type WorldDimensions } from './grid';
import { findPath, getPathfindingDiagnostics } from './pathfinding';
import { drawInt, normalizeSeed } from './prng';
import { createWeather } from './weather';
import {
  buildWorld96Layout, validateWorld96Layout, ROAD_BACKUP_CASES, type World96Layout,
} from './world96Layout';
import {
  createWorld, walkable, type Citizen, type ResourceNode, type Site, type Terrain, type WorldStateV6,
} from './world';

export const WORLD96_DIMENSIONS: WorldDimensions = Object.freeze({ width: 96, height: 96 });
export type World96State = WorldStateV6 & { layout: World96Layout };
export const WORLD96_DISTRICTS = Object.freeze({
  residential: { minX: 10, maxX: 40, minY: 14, maxY: 76 },
  civic: { minX: 41, maxX: 70, minY: 31, maxY: 62 },
  nature: { minX: 71, maxX: 95, minY: 0, maxY: 95 },
});
export type World96Population = 20 | 50 | 100;

const HOMES: TilePosition[] = [15, 25, 35, 65, 75]
  .flatMap(y => [12, 19, 26, 33, 40].map(x => ({ x, y })));
const WORK: TilePosition[] = [
  { x: 48, y: 32 }, { x: 64, y: 32 }, { x: 49, y: 61 },
  { x: 64, y: 61 }, { x: 57, y: 54 },
];
const COMMONS: TilePosition = { x: 56, y: 46 };
const MARKET: TilePosition = { x: 57, y: 46 };
const FIELDS: TilePosition[] = [
  { x: 70, y: 41 }, { x: 76, y: 43 }, { x: 82, y: 43 },
  { x: 88, y: 43 }, { x: 92, y: 45 }, { x: 74, y: 49 },
  { x: 80, y: 50 }, { x: 86, y: 50 }, { x: 92, y: 51 },
  { x: 68, y: 55 },
];
const FORESTS: TilePosition[] = [
  { x: 82, y: 7 }, { x: 93, y: 11 }, { x: 78, y: 83 },
  { x: 88, y: 83 }, { x: 72, y: 78 },
];

function same(a: TilePosition, b: TilePosition): boolean {
  return a.x === b.x && a.y === b.y;
}
function key(tile: TilePosition): string { return tile.x + ',' + tile.y; }
function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Invalid W02-C world: ' + message);
}

/**
 * A bounded authored road network: five residential streets, a civic ring,
 * and a waterfront service lane. Every endpoint has a real walkable approach.
 * Future W02-D metadata/entrances can annotate these same coordinates.
 */
function generateTerrain(seed: number): { tiles: Terrain[]; rngState: number } {
  let rngState = normalizeSeed(seed ^ 0x1c8e63);
  const draw = (max: number): number => {
    const result = drawInt(rngState, max);
    rngState = result.state;
    return result.value;
  };
  const lakeX = 84 + draw(3);
  const lakeY = 26 + draw(3);
  const lakeRx = 8 + draw(2);
  const lakeRy = 11 + draw(2);
  const pondX = 84 + draw(3);
  const pondY = 64 + draw(3);
  const pondRy = 7 + draw(2);
  const tiles: Terrain[] = [];
  for (let y = 0; y < 96; y += 1) for (let x = 0; x < 96; x += 1) {
    const lake = ((x - lakeX) ** 2) / (lakeRx ** 2) + ((y - lakeY) ** 2) / (lakeRy ** 2) < 1;
    const pond = ((x - pondX) ** 2) / 36 + ((y - pondY) ** 2) / (pondRy ** 2) < 1;
    const vegetation = draw(100);
    tiles.push(x >= 74 && (lake || pond) ? 'water' :
      vegetation < (x >= 71 ? 57 : x >= 41 ? 9 : 20) ? 'forest' : 'grass');
  }

  const road = (x: number, y: number): void => {
    const index = tileIndexAt({ x, y }, WORLD96_DIMENSIONS);
    requireCondition(index !== null && tiles[index] !== 'water', 'road crosses water');
    tiles[index] = 'road';
  };
  const horizontal = (y: number, start: number, end: number): void => {
    for (let x = Math.min(start, end); x <= Math.max(start, end); x += 1) road(x, y);
  };
  const vertical = (x: number, start: number, end: number): void => {
    for (let y = Math.min(start, end); y <= Math.max(start, end); y += 1) road(x, y);
  };

  // Residential: visible gridded neighborhoods with two access corridors.
  vertical(11, 15, 75);
  vertical(40, 15, 75);
  for (const y of [15, 25, 35, 65, 75]) horizontal(y, 11, 40);
  // Civic: central market and commons, multiple streets connecting the suburbs.
  horizontal(46, 11, 70);
  vertical(57, 31, 62);
  horizontal(31, 40, 70);
  horizontal(62, 40, 70);
  vertical(70, 7, 83);
  for (const site of WORK) {
    horizontal(site.y, site.x, 57);
    vertical(57, site.y, 46);
  }
  horizontal(COMMONS.y, COMMONS.x, MARKET.x);
  // Nature: service paths intentionally skirt both ponds and lead to harvest sites.
  for (const node of [...FIELDS, ...FORESTS]) {
    vertical(70, 46, node.y);
    horizontal(node.y, 70, node.x);
  }
  return { tiles, rngState };
}

/**
 * A new 96x96 world is a separate runtime type. Economic starting amounts,
 * names, citizen IDs, market ownership and households come from the unchanged
 * v5 initializer; only geography and 100-pop housing availability differ.
 */
export function createWorld96(seed: number, population: World96Population): World96State {
  const initial = createWorld(seed, population);
  const { tiles, rngState } = generateTerrain(seed);
  let homeIndex = 0;
  let workIndex = 0;
  const sites: Site[] = initial.sites.map(site => {
    const tile = site.kind === 'home' ? HOMES[homeIndex++] :
      site.kind === 'work' ? WORK[workIndex++] :
        site.kind === 'commons' ? COMMONS : MARKET;
    requireCondition(tile !== undefined, 'unexpected economic site');
    return { ...site, tile: { ...tile } };
  });
  let nextEntityId = initial.nextEntityId;
  // 25 houses * existing 4-person capacity serves 100 without creating money/food.
  for (let index = homeIndex; index < HOMES.length; index += 1) {
    sites.push({ id: nextEntityId++, name: 'Nhà ven phố ' + (index + 1),
      kind: 'home', tile: { ...HOMES[index]! }, capacity: BALANCE.houseCapacity });
  }

  let fieldIndex = 0;
  let forestIndex = 0;
  const resourceNodes: ResourceNode[] = initial.resourceNodes.map(node => ({
    ...node,
    tile: { ...(node.kind === 'field' ? FIELDS[fieldIndex++]! : FORESTS[forestIndex++]!) },
  }));
  const homesById = new Map(sites.filter(site => site.kind === 'home').map(site => [site.id, site]));
  const households = initial.households.map(household => ({ ...household, members: [...household.members] }));
  const usedCapacity = new Map<number, number>();
  for (const citizen of initial.citizens) if (citizen.homeId !== null)
    usedCapacity.set(citizen.homeId, (usedCapacity.get(citizen.homeId) ?? 0) + 1);
  const spareHomes = sites.filter(site => site.kind === 'home' && !initial.sites.some(old => old.id === site.id));
  let spareIndex = 0;
  const citizens: Citizen[] = initial.citizens.map(citizen => {
    let homeId = citizen.homeId;
    let householdId = citizen.householdId;
    if (homeId === null) {
      const home = spareHomes[spareIndex]!;
      requireCondition(home !== undefined, 'insufficient housing');
      homeId = home.id;
      usedCapacity.set(homeId, (usedCapacity.get(homeId) ?? 0) + 1);
      if (usedCapacity.get(homeId) === BALANCE.houseCapacity) spareIndex += 1;
      householdId = nextEntityId++;
      households.push({ id: householdId, homeId, members: [citizen.id],
        formedTick: 0, lastBirthTick: -BALANCE.birthCooldownHours });
    }
    const home = homesById.get(homeId);
    requireCondition(home, 'missing citizen home');
    const spawn = { ...home.tile };
    return { ...citizen, homeId, householdId, tile: spawn,
      destination: { ...spawn }, lastMove: [{ ...spawn }], route: [] };
  });

  const layout = buildWorld96Layout(seed, tiles, sites, resourceNodes);
  const world: World96State = {
    ...initial, schemaVersion: 6, map: WORLD96_DIMENSIONS, layout, weather: createWeather(seed), rngState, nextEntityId,
    tiles, sites, resourceNodes, households, citizens,
  };
  validateWorld96(world);
  return world;
}

/** Validation uses actual findPath on all unique endpoints, not visual road counts. */
export function validateWorld96(world: World96State): void {
  requireCondition(world.schemaVersion === 6 && world.map.width === 96 && world.map.height === 96,
    'schema or dimensions');
  requireCondition(world.tiles.length === 9216, 'tile count');
  requireCondition(world.tiles.every(tile => ['grass', 'forest', 'water', 'road'].includes(tile)), 'terrain enum');
  requireCondition(world.citizens.length === 20 || world.citizens.length === 50 || world.citizens.length === 100,
    'population');
  const sitesById = new Map(world.sites.map(site => [site.id, site]));
  const nodesById = new Map(world.resourceNodes.map(node => [node.id, node]));
  const citizensById = new Map(world.citizens.map(citizen => [citizen.id, citizen]));
  const householdsById = new Map(world.households.map(household => [household.id, household]));
  const ids = [...world.sites, ...world.resourceNodes, ...world.citizens, ...world.households, ...world.constructions]
    .map(entity => entity.id);
  requireCondition(new Set(ids).size === ids.length &&
    ids.every(id => Number.isSafeInteger(id) && id > 0 && id < world.nextEntityId), 'duplicate/invalid entity IDs');
  requireCondition(world.sites.filter(site => site.kind === 'home').length === 25 &&
    world.sites.filter(site => site.kind === 'work').length === 5 &&
    world.sites.filter(site => site.kind === 'commons').length === 1 &&
    world.sites.filter(site => site.kind === 'market').length === 1, 'economic site counts');
  const market = sitesById.get(world.market.siteId);
  const commons = world.sites.find(site => site.kind === 'commons');
  requireCondition(market?.kind === 'market' && commons !== undefined, 'market/commons ownership');
  const positions = new Set<string>();
  const verifyPosition = (position: TilePosition, context: string): void => {
    requireCondition(isValidTileAt(position, WORLD96_DIMENSIONS) && walkable(world, position),
      context + ' not walkable/in bounds');
  };
  for (const entity of [...world.sites, ...world.resourceNodes]) {
    verifyPosition(entity.tile, 'entity');
    requireCondition(!positions.has(key(entity.tile)), 'overlapping site or resource');
    positions.add(key(entity.tile));
  }
  for (const site of world.sites) {
    if (site.kind === 'home') requireCondition(site.tile.x <= 40 &&
      site.capacity === BALANCE.houseCapacity, 'residential layout/capacity');
    else requireCondition(site.tile.x >= 41 && site.tile.x <= 70, 'civic layout');
  }
  requireCondition(world.resourceNodes.every(node => node.tile.x >= 68), 'nature resource layout');
  requireCondition(world.tiles.some((tile, index) => tile === 'water' && index % 96 >= 74),
    'waterfront missing');
  requireCondition(world.tiles.some((tile, index) => tile === 'forest' && index % 96 >= 71),
    'natural forest missing');
  const occupancy = new Map<number, number>();
  for (const citizen of world.citizens) {
    verifyPosition(citizen.tile, 'citizen spawn');
    verifyPosition(citizen.destination, 'citizen destination');
    for (const p of [...citizen.route, ...citizen.lastMove]) verifyPosition(p, 'citizen route');
    requireCondition(citizen.route.length <= 9216 && citizen.lastMove.length <= 9216, 'route length');
    const home = sitesById.get(citizen.homeId ?? -1);
    requireCondition(home?.kind === 'home' && same(citizen.tile, home.tile), 'citizen home/spawn');
    requireCondition(sitesById.get(citizen.workId)?.kind === 'work', 'work reference');
    requireCondition(citizen.householdId !== null && householdsById.has(citizen.householdId), 'household reference');
    requireCondition(citizen.workNodeId === null || nodesById.has(citizen.workNodeId), 'node reference');
    requireCondition(citizen.partnerId === null || citizensById.has(citizen.partnerId), 'partner reference');
    requireCondition(Object.keys(citizen.relations).every(id => citizensById.has(Number(id))), 'social reference');
    requireCondition(Number.isSafeInteger(citizen.wallet) && citizen.wallet >= 0 &&
      citizen.inventory.food >= 0 && citizen.inventory.wood >= 0, 'citizen assets');
    occupancy.set(home.id, (occupancy.get(home.id) ?? 0) + (citizen.alive ? 1 : 0));
  }
  for (const household of world.households) {
    requireCondition(sitesById.get(household.homeId)?.kind === 'home' &&
      household.members.length > 0 && new Set(household.members).size === household.members.length &&
      household.members.every(id => citizensById.get(id)?.householdId === household.id), 'household members');
  }
  for (const site of world.sites.filter(site => site.kind === 'home')) {
    requireCondition((occupancy.get(site.id) ?? 0) <= (site.capacity ?? 0), 'house capacity');
  }
  for (const node of world.resourceNodes) {
    requireCondition(node.stock >= 0 && node.stock <= node.capacity &&
      node.regenerationPerDay >= 0 && node.capacity > 0, 'resource balances');
  }
  for (const construction of world.constructions) {
    verifyPosition(construction.tile, 'construction');
    requireCondition(construction.builderId === null || citizensById.has(construction.builderId), 'builder reference');
  }
  requireCondition(world.market.cash >= 0 && world.inventory.food >= 0 && world.inventory.wood >= 0,
    'market stock/cash');
  requireCondition(world.market.initialSupply === world.market.cash +
    world.citizens.reduce((sum, citizen) => sum + citizen.wallet, 0), 'currency conservation');
  requireCondition(world.market.trades.every(trade => citizensById.has(trade.citizenId)), 'trade references');

  // Every unique endpoint reaches the market: connectivity is transitive, so
  // all NPC homes, jobs, commons and resource nodes can reach one another.
  const endpoints = new Map<string, TilePosition>();
  for (const entity of [...world.sites, ...world.resourceNodes])
    endpoints.set(key(entity.tile), entity.tile);
  for (const citizen of world.citizens) endpoints.set(key(citizen.tile), citizen.tile);
  for (const [point, destination] of endpoints)
    requireCondition(findPath(world, market.tile, destination) !== null, 'disconnected endpoint ' + point);
  validateWorld96Layout(world);
  // Check the real movement algorithm against road-segment obstruction fixtures.
  // Road-only alternatives are independently verified in the layout validator.
  for (const { from, to, obstruction } of ROAD_BACKUP_CASES) {
    const index = tileIndexAt(obstruction, WORLD96_DIMENSIONS)!;
    const blocked: World96State = { ...world, tiles: [...world.tiles] };
    blocked.tiles[index] = 'water';
    const path = findPath(blocked, from, to);
    requireCondition(path !== null && path.every(tile => walkable(blocked, tile)),
      'real pathfinding cannot recover from road obstruction');
  }
}

export function describeWorld96(world: World96State): {
  tiles: number; sites: number; nodes: number; npc: number; water: number; forest: number;
  roads: number; entrances: number; pois: number; metadataChars: number; pathfindingCalls: number;
} {
  return { tiles: world.tiles.length, sites: world.sites.length,
    nodes: world.resourceNodes.length, npc: world.citizens.length,
    water: world.tiles.filter(tile => tile === 'water').length,
    forest: world.tiles.filter(tile => tile === 'forest').length,
    roads: world.layout.roads.length, entrances: world.layout.entrances.length,
    pois: world.layout.pois.length, metadataChars: JSON.stringify(world.layout).length,
    pathfindingCalls: getPathfindingDiagnostics() };
}
