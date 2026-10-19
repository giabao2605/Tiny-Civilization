/** N03-D authoritative short visits to existing 96x96 event POIs, without new state or PRNG. */
import { BALANCE } from './balance';
import type { TilePosition } from './grid';
import { findPath } from './pathfinding';
import { walkable, type Citizen, type WorldState } from './world';
import type { Poi96 } from './world96Layout';

export const LEISURE_START_HOUR = 18;
export const LEISURE_END_HOUR = 21;
export const LEISURE_MAX_STEPS = BALANCE.moveTilesPerHour * 2;
const distance = (a: TilePosition, b: TilePosition): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** POI labels are observational; no POI creates a resource site or entitlement. */
export function poiAt(world: WorldState, tile: TilePosition): Poi96 | null {
  if (world.schemaVersion !== 6 || !world.layout) return null;
  return world.layout.pois.find(p => p.role === 'event' &&
    p.tile.x === tile.x && p.tile.y === tile.y) ?? null;
}

/** A visit spans at most the three evening decisions 18,19,20; no new save field. */
export function continuingLeisure(c: Citizen, tick: number, hour: number): boolean {
  if (c.goal !== 'leisure' || hour >= LEISURE_END_HOUR) return false;
  const recent = [...c.recent].reverse().find(entry =>
    entry.activity === 'travelToLeisure' || entry.activity === 'leisureIdle');
  return recent !== undefined && tick - recent.tick <= 2;
}

/** Odd/even day scheduling gives a >=48h start cooldown per citizen. */
export function chooseLeisurePoi(world: WorldState, c: Citizen, tick: number, hour: number): Poi96 | null {
  if (world.schemaVersion !== 6 || !world.layout || world.map.width !== 96 ||
    world.map.height !== 96 || hour !== LEISURE_START_HOUR ||
    (Math.floor(tick / 24) + c.id) % 2 !== 0 ||
    !c.alive || c.age < BALANCE.adultAge || c.needMode !== null ||
    c.health < 65 || c.hunger < 72 || c.energy < 50 ||
    (c.inventory.food === 0 && (c.wallet < world.market.prices.foodSell || world.inventory.food === 0)))
    return null;
  const candidates = world.layout.pois.filter(p => p.role === 'event' && walkable(world, p.tile) &&
    distance(c.tile, p.tile) <= LEISURE_MAX_STEPS)
    .sort((a, b) => distance(c.tile, a.tile) - distance(c.tile, b.tile) ||
      a.id.localeCompare(b.id));
  for (const poi of candidates) {
    const path = findPath(world, c.tile, poi.tile);
    if (path !== null && path.length <= LEISURE_MAX_STEPS) return poi;
  }
  return null;
}
