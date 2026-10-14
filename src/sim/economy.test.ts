import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { buyFromMarket, sellToMarket, startConstruction, buildOneHour } from './economy';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { findPath } from './pathfinding';
import { createWorld, housing, marketTile, totalCurrency, walkable, type WorldState } from './world';

function check(world: WorldState) {
  const total = totalCurrency(world);
  expect(total).toBe(world.market.initialSupply);
  expect(world.market.cash).toBeGreaterThanOrEqual(0);
  expect(world.inventory.food).toBeGreaterThanOrEqual(0);
  expect(world.inventory.wood).toBeGreaterThanOrEqual(0);
  expect(world.inventory.food).toBeLessThanOrEqual(BALANCE.townFoodCapacity);
  expect(world.inventory.wood).toBeLessThanOrEqual(BALANCE.townWoodCapacity);
  const goods = world.citizens.reduce((a, c) => ({ food: a.food + c.inventory.food, wood: a.wood + c.inventory.wood }), { food: 0, wood: 0 });
  const initial = createWorld(world.seed, world.citizens.length as 20 | 50 | 100);
  expect(world.inventory.food + goods.food).toBe(initial.inventory.food + world.stats.totalFoodProduced - world.stats.totalFoodConsumed);
  expect(world.inventory.wood + goods.wood + world.constructions.reduce((sum, c) => sum + c.woodSpent, 0))
    .toBe(initial.inventory.wood + world.stats.totalWoodProduced);
  const h = housing(world);
  expect(h.occupied).toBeLessThanOrEqual(h.capacity);
  const occupied = new Map<number, number>();
  const ids = [...world.sites, ...world.citizens, ...world.resourceNodes, ...world.constructions].map((x) => x.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const c of world.citizens) {
    expect(Number.isSafeInteger(c.wallet)).toBe(true);
    expect(c.wallet).toBeGreaterThanOrEqual(0);
    for (const good of ['food', 'wood'] as const) {
      expect(c.inventory[good]).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(c.inventory[good])).toBe(true);
    }
    for (const need of [c.hunger, c.energy, c.health]) {
      expect(need).toBeGreaterThanOrEqual(0);
      expect(need).toBeLessThanOrEqual(100);
    }
    expect(walkable(world, c.tile)).toBe(true);
    if (c.homeId !== null) {
      const house = world.sites.find((s) => s.id === c.homeId);
      expect(house?.kind).toBe('home');
      if (c.alive) occupied.set(c.homeId, (occupied.get(c.homeId) ?? 0) + 1);
    }
    if (!c.alive) expect(c.activity).toBe('dead');
    if (c.lastMove.length > 1) expect(c.actionDuration).toBe(0);
  }
  for (const [id, count] of occupied) {
    expect(count).toBeLessThanOrEqual(world.sites.find((s) => s.id === id)!.capacity!);
  }
  for (const n of world.resourceNodes) {
    expect(n.stock).toBeGreaterThanOrEqual(0);
    expect(n.stock).toBeLessThanOrEqual(n.capacity);
  }
}

describe('Phase 03 deterministic economy and adversarial invariants', () => {
  it('generates 20/50/100 valid citizens, distinct IDs and connected landmarks', () => {
    for (const population of [20, 50, 100] as const) {
      const world = createWorld(909, population);
      expect(world.citizens).toHaveLength(population);
      expect(createWorld(909, population)).toEqual(world);
      expect(housing(world).homeless).toBe(Math.max(0, population - 80));
      for (const site of world.sites) {
        expect(walkable(world, site.tile)).toBe(true);
        expect(findPath(world, site.tile, marketTile(world))).not.toBeNull();
      }
      check(world);
    }
    expect(() => createWorld(1, 120 as 100)).toThrow();
  });

  it('atomic concurrent last food and exact coins: exactly one buyer receives item', () => {
    const w = createWorld(1);
    w.tick = 1; w.inventory.food = 1;
    const buyer = w.citizens[0]!, second = w.citizens[1]!;
    for (const c of [buyer, second]) {
      c.tile = { ...marketTile(w) };
      c.wallet = w.market.prices.foodSell;
    }
    const before = totalCurrency(w);
    expect(buyFromMarket(w, buyer, 'food')).toBe(true);
    expect(buyFromMarket(w, second, 'food')).toBe(false);
    expect(w.inventory.food).toBe(0);
    expect(buyer.inventory.food).toBe(1);
    expect(second.inventory.food).toBe(0);
    expect(buyer.wallet).toBe(0);
    expect(w.market.completedTrades).toBe(1);
    expect(totalCurrency(w)).toBe(before);
  });

  it('bankruptcy, no stock, invalid location, dead agent and invalid quantity are no-ops', () => {
    const w = createWorld(4);
    const c = w.citizens[0]!;
    const before = JSON.stringify(w);
    expect(buyFromMarket(w, c, 'wood')).toBe(false);
    expect(sellToMarket(w, c, 'food')).toBe(false);
    expect(JSON.stringify(w)).toBe(before);
    c.tile = { ...marketTile(w) }; c.wallet = 0;
    expect(buyFromMarket(w, c, 'food')).toBe(false);
    c.wallet = 100;
    expect(buyFromMarket(w, c, 'food', 0)).toBe(false);
    expect(buyFromMarket(w, c, 'food', -1)).toBe(false);
    w.inventory.food = 0;
    expect(buyFromMarket(w, c, 'food')).toBe(false);
    c.inventory.wood = 1; w.market.cash = 0;
    expect(sellToMarket(w, c, 'wood')).toBe(false);
    c.alive = false; w.market.cash = 100;
    expect(sellToMarket(w, c, 'wood')).toBe(false);
  });

  it('producer sale needs stock and finite treasury; warehouse capacity is real', () => {
    const w = createWorld(2);
    w.tick = 1;
    const c = w.citizens[0]!;
    c.tile = { ...marketTile(w) };
    c.inventory.food = 2;
    w.market.cash = w.market.prices.foodBuy * 2;
    const money = totalCurrency(w);
    const beforeFood = w.inventory.food;
    expect(sellToMarket(w, c, 'food', 2)).toBe(true);
    expect(w.market.cash).toBe(0);
    expect(c.wallet).toBe(BALANCE.initialWallet + 2 * w.market.prices.foodBuy);
    expect(w.inventory.food).toBe(beforeFood + 2);
    expect(c.inventory.food).toBe(0);
    expect(totalCurrency(w)).toBe(money);
    c.inventory.food = 1;
    expect(sellToMarket(w, c, 'food')).toBe(false);
    w.market.cash = 100;
    w.inventory.food = BALANCE.townFoodCapacity;
    expect(sellToMarket(w, c, 'food')).toBe(false);
  });

  it('wood is reserved once at start, builders require time, life and funded wages', () => {
    const w = createWorld(5, 100);
    w.inventory.wood = BALANCE.houseWoodCost;
    const job = startConstruction(w)!;
    expect(job.status).toBe('active');
    expect(w.inventory.wood).toBe(0);
    expect(startConstruction(w)).toBeNull();
    const builder = w.citizens.find((c) => c.id === job.builderId)!;
    builder.tile = { ...job.tile };
    const money = totalCurrency(w);
    for (let hour = 1; hour < BALANCE.houseConstructionHours; hour += 1) {
      expect(buildOneHour(w, builder, job)).toBe(true);
      expect(job.status).toBe('active');
    }
    expect(buildOneHour(w, builder, job)).toBe(true);
    expect(job.status).toBe('complete');
    expect(housing(w).capacity).toBe(84);
    expect(housing(w).homeless).toBe(16);
    expect(totalCurrency(w)).toBe(money);
    expect(buildOneHour(w, builder, job)).toBe(false);
    const w2 = createWorld(5, 100);
    const job2 = startConstruction(w2)!;
    const deadBuilder = w2.citizens.find((c) => c.id === job2.builderId)!;
    deadBuilder.tile = { ...job2.tile }; deadBuilder.alive = false;
    expect(buildOneHour(w2, deadBuilder, job2)).toBe(false);
    expect(job2.progress).toBe(0);
    const w3 = createWorld(5, 100);
    w3.inventory.wood = 0;
    expect(startConstruction(w3)).toBeNull();
  });

  it('market insolvency and no-food do not invent resources or offer free meals', () => {
    const w = createWorld(6);
    w.inventory.food = 0; w.market.cash = 0;
    for (const c of w.citizens) { c.wallet = 0; c.inventory.food = 0; c.inventory.wood = 0; c.hunger = 0; }
    for (const n of w.resourceNodes) { n.stock = 0; n.regenerationPerDay = 0; }
    const firstDay = advanceTicks(w, 24);
    expect(firstDay.stats.totalFoodConsumed).toBe(0);
    expect(firstDay.citizens.every((c) => c.health >= 90)).toBe(true);
    const later = advanceTicks(firstDay, 250);
    expect(later.citizens.some((c) => !c.alive)).toBe(true);
    expect(later.inventory.food).toBe(0);
    expect(later.market.cash).toBe(0);
  });

  it('100 NPC, 10 seeds × 720 ticks: money and physical goods conserve on every run', () => {
    const rows = [];
    for (let seed = 1; seed <= 10; seed += 1) {
      const initial = createWorld(seed, 100);
      const after = advanceTicks(initial, 720);
      check(after);
      expect(after.citizens).toHaveLength(100);
      expect(after.market.completedTrades).toBeGreaterThan(0);
      rows.push({ seed, alive: after.citizens.filter((c) => c.alive).length,
        dead: after.stats.deaths, food: after.inventory.food, wood: after.inventory.wood,
        produced: after.stats.totalFoodProduced, consumed: after.stats.totalFoodConsumed,
        money: totalCurrency(after), marketCash: after.market.cash, trades: after.market.completedTrades,
        housing: housing(after), failed: after.stats.failedActions });
      if (seed === 1) {
        const replay = advanceTicks(createWorld(seed, 100), 720);
        expect(stateDigest(after)).toBe(stateDigest(replay));
        expect(after).toEqual(replay);
      }
    }
    console.log('PHASE03_100_NPC_BASELINE=' + JSON.stringify(rows));
  }, 180000);

  it('20 and 50 NPC simulations remain deterministic for 30 days', () => {
    for (const population of [20, 50] as const) {
      for (let seed = 1; seed <= 3; seed += 1) {
        const a = advanceTicks(createWorld(seed, population), 720);
        check(a);
        expect(stateDigest(a)).toBe(stateDigest(advanceTicks(createWorld(seed, population), 720)));
        console.log('PHASE03_BALANCE=' + JSON.stringify({ population, seed,
          alive: a.citizens.filter((c) => c.alive).length, trades: a.market.completedTrades,
          food: a.inventory.food, wood: a.inventory.wood, money: totalCurrency(a) }));
      }
    }
  }, 180000);

  it('single ticks, batch, JSON clone and snapshots have identical outcomes', () => {
    const original = createWorld(13, 50);
    let steps = JSON.parse(JSON.stringify(original)) as WorldState;
    for (let i = 0; i < 120; i += 1) steps = advanceOneTick(steps);
    const batch = advanceTicks(original, 120);
    expect(batch).toEqual(steps);
    expect(stateDigest(batch)).toBe(stateDigest(steps));
    expect(original.tick).toBe(0);
  });
});
