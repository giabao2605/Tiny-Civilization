import { BALANCE } from './balance';
import { findPath } from './pathfinding';
import { marketTile, walkable, housing, type Citizen, type Construction, type Good, type WorldState } from './world';
import type { TilePosition } from './grid';

function amountIsValid(quantity: number): boolean {
  return Number.isSafeInteger(quantity) && quantity > 0;
}
function atMarket(world: WorldState, citizen: Citizen): boolean {
  const tile = marketTile(world);
  return citizen.alive && citizen.tile.x === tile.x && citizen.tile.y === tile.y;
}
function price(world: WorldState, good: Good, direction: 'buy' | 'sell'): number {
  return good === 'food' ? (direction === 'buy' ? world.market.prices.foodSell : world.market.prices.foodBuy)
    : (direction === 'buy' ? world.market.prices.woodSell : world.market.prices.woodBuy);
}
function recordTrade(world: WorldState, citizen: Citizen, good: Good, quantity: number, amount: number, direction: 'buy' | 'sell'): void {
  world.market.completedTrades += 1;
  world.market.volumeToday += quantity;
  world.market.trades.push({ tick: world.tick, citizenId: citizen.id, good, quantity, amount, direction });
  if (world.market.trades.length > BALANCE.tradeHistoryLimit) world.market.trades.shift();
  citizen.lastTradeTick = world.tick;
}

/** Buyer gives coins, market gives a physically stocked good. All guards precede mutations. */
export function buyFromMarket(world: WorldState, citizen: Citizen, good: Good, quantity = 1): boolean {
  const cost = price(world, good, 'buy') * quantity;
  if (!amountIsValid(quantity) || !atMarket(world, citizen) ||
      world.tick - citizen.lastTradeTick < BALANCE.tradeCooldown ||
      world.inventory[good] < quantity || citizen.wallet < cost ||
      citizen.inventory[good] + quantity > 6) return false;
  citizen.wallet -= cost;
  world.market.cash += cost;
  world.inventory[good] -= quantity;
  citizen.inventory[good] += quantity;
  recordTrade(world, citizen, good, quantity, cost, 'buy');
  return true;
}

/** Producer gives already-owned stock, market pays from a finite treasury. */
export function sellToMarket(world: WorldState, citizen: Citizen, good: Good, quantity = 1): boolean {
  const payout = price(world, good, 'sell') * quantity;
  const capacity = good === 'food' ? BALANCE.townFoodCapacity : BALANCE.townWoodCapacity;
  if (!amountIsValid(quantity) || !atMarket(world, citizen) ||
      world.tick - citizen.lastTradeTick < BALANCE.tradeCooldown ||
      citizen.inventory[good] < quantity || world.market.cash < payout ||
      world.inventory[good] + quantity > capacity) return false;
  citizen.inventory[good] -= quantity;
  world.inventory[good] += quantity;
  world.market.cash -= payout;
  citizen.wallet += payout;
  recordTrade(world, citizen, good, quantity, payout, 'sell');
  return true;
}

function isFreeSite(world: WorldState, tile: TilePosition): boolean {
  return walkable(world, tile) &&
    !world.sites.some((site) => site.tile.x === tile.x && site.tile.y === tile.y) &&
    !world.resourceNodes.some((node) => node.tile.x === tile.x && node.tile.y === tile.y) &&
    !world.constructions.some((site) => site.tile.x === tile.x && site.tile.y === tile.y) &&
    findPath(world, marketTile(world), tile) !== null;
}
function constructionTile(world: WorldState): TilePosition | null {
  // Stable, finite plots adjacent to the existing settlement. No overlapping sites.
  for (const y of [15, 19, 26, 31, 35, 22, 28]) {
    for (const x of [14, 19, 24, 29, 34]) {
      const tile = { x, y };
      if (isFreeSite(world, tile)) return tile;
    }
  }
  return null;
}

/** Wood is taken exactly once, at site creation. An unfinished site retains sunk materials. */
export function startConstruction(world: WorldState): Construction | null {
  if (housing(world).homeless === 0 || world.constructions.some((c) => c.status === 'active') ||
      world.inventory.wood < BALANCE.houseWoodCost) return null;
  const builder = world.citizens.find((c) => c.alive && c.job === 'builder');
  const tile = constructionTile(world);
  if (!builder || !tile) return null;
  world.inventory.wood -= BALANCE.houseWoodCost;
  const construction: Construction = { id: world.nextEntityId++, tile, woodSpent: BALANCE.houseWoodCost,
    hoursRequired: BALANCE.houseConstructionHours, progress: 0, builderId: builder.id, status: 'active' };
  world.constructions.push(construction);
  return construction;
}

/** One stationary hour, paid from existing coins. Never completes for a dead builder. */
export function buildOneHour(world: WorldState, citizen: Citizen, construction: Construction): boolean {
  if (!citizen.alive || citizen.job !== 'builder' || construction.status !== 'active' ||
      construction.builderId !== citizen.id || citizen.tile.x !== construction.tile.x ||
      citizen.tile.y !== construction.tile.y || world.market.cash < BALANCE.builderHourlyPay) return false;
  world.market.cash -= BALANCE.builderHourlyPay;
  citizen.wallet += BALANCE.builderHourlyPay;
  construction.progress += 1;
  if (construction.progress >= construction.hoursRequired) {
    construction.status = 'complete';
    const house = { id: world.nextEntityId++, kind: 'home' as const,
      name: 'Nhà mới ' + construction.id, tile: { ...construction.tile }, capacity: BALANCE.houseCapacity };
    world.sites.push(house);
    let remaining: number = house.capacity;
    for (const resident of world.citizens) {
      if (remaining === 0) break;
      if (resident.alive && resident.homeId === null) {
        resident.homeId = house.id;
        remaining -= 1;
      }
    }
  }
  return true;
}

export function assignBuilder(world: WorldState, construction: Construction): Citizen | null {
  let builder = world.citizens.find((c) => c.id === construction.builderId && c.alive && c.job === 'builder');
  if (!builder) {
    builder = world.citizens.find((c) => c.alive && c.job === 'builder');
    construction.builderId = builder?.id ?? null;
  }
  return builder ?? null;
}
