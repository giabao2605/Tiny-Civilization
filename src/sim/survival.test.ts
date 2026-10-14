import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { createWorld, marketTile } from './world';

function noSupply() {
  const world = createWorld(12345);
  world.inventory.food = 0;
  for (const c of world.citizens) c.inventory.food = 0;
  for (const node of world.resourceNodes) {
    node.stock = 0;
    node.regenerationPerDay = 0;
  }
  return world;
}

describe('Survival rules retained under Phase 03 owned-food economy', () => {
  it('decays hunger once per hour, never feeds citizens without owned food', () => {
    const world = noSupply();
    const first = world.citizens[0]!;
    first.hunger = 99;
    first.energy = 0;
    first.wallet = 0;
    const after = advanceTicks(world, 24);
    expect(after.citizens[0]!.hunger).toBe(51);
    expect(after.citizens[0]!.energy).toBeGreaterThanOrEqual(0);
    expect(after.stats.totalFoodConsumed).toBe(0);
    expect(after.inventory.food).toBe(0);
    expect(after.stats.failedActions).toBeGreaterThan(0);
  });

  it('two hungry citizens cannot eat the same owned food', () => {
    const world = noSupply();
    const c = world.citizens[0]!;
    const d = world.citizens[1]!;
    c.hunger = d.hunger = 0;
    c.inventory.food = 1;
    d.inventory.food = 0;
    c.goal = 'food'; c.activity = 'eating';
    c.destination = { ...c.tile };
    c.route = [];
    d.wallet = 0;
    const after = advanceOneTick(world);
    expect(after.stats.totalFoodConsumed).toBe(1);
    expect(after.citizens[0]!.hunger).toBe(BALANCE.foodNutrition);
    expect(after.citizens[1]!.hunger).toBe(0);
    expect(after.citizens[0]!.inventory.food).toBe(0);
  });

  it('daily regeneration remains bounded, never reloads every hourly tick', () => {
    const world = createWorld(4);
    world.tick = 23;
    for (const c of world.citizens) c.alive = false;
    const node = world.resourceNodes[0]!;
    node.stock = node.capacity - 1;
    node.regenerationPerDay = 8;
    const next = advanceOneTick(world);
    expect(next.resourceNodes[0]!.stock).toBe(node.capacity);
    expect(advanceOneTick(next).resourceNodes[0]!.stock).toBe(node.capacity);
  });

  it('fatigue and critical health preempt regular work', () => {
    const world = createWorld(12345);
    world.tick = 6;
    const c = world.citizens[0]!;
    c.energy = 0; c.hunger = 98; c.health = 20;
    const after = advanceOneTick(world).citizens[0]!;
    expect(after.goal).toBe('home');
    expect(after.needMode).toBe('rest');
    expect(after.reason).toMatch(/sức khỏe|phục hồi|nghỉ/i);
  });

  it('severe starvation has a grace period, then health damage and death', () => {
    const world = noSupply();
    for (const c of world.citizens) {
      c.hunger = 0; c.health = 100; c.wallet = 0;
    }
    const initial = advanceTicks(world, 24);
    expect(initial.citizens.every((c) => c.health === 100)).toBe(true);
    const later = advanceTicks(initial, 200);
    expect(later.citizens.some((c) => !c.alive)).toBe(true);
    const dead = later.citizens.find((c) => !c.alive)!;
    const after = advanceTicks(later, 12).citizens.find((c) => c.id === dead.id)!;
    expect(after).toEqual(dead);
  });

  it('production creates personal goods only and purchases have a stationary hour', () => {
    let world = createWorld(3);
    let sawWork = false; let sawPersonalFood = false; let sawSale = false; let sawMeal = false;
    for (let i = 0; i < 140; i += 1) {
      world = advanceOneTick(world);
      for (const c of world.citizens) {
        if (c.lastMove.length > 1) expect(c.actionDuration).toBe(0);
        if (c.activity === 'atWork' && c.workHours > 0) sawWork = true;
        if (c.inventory.food > 0) sawPersonalFood = true;
        if (c.activity === 'eating' && c.actionDuration === 1) sawMeal = true;
      }
      sawSale ||= world.events.some((e) => e.type === 'sold');
    }
    expect([sawWork, sawPersonalFood, sawSale, sawMeal]).toEqual([true, true, true, true]);
    const merchant = world.citizens.find((c) => c.alive)!;
    expect(marketTile(world)).toBeDefined();
    expect(merchant.wallet).toBeGreaterThanOrEqual(0);
  });

  it('pure deterministic survival replay, no FPS or wall-clock dependency', () => {
    const a = advanceTicks(createWorld(222), 240);
    const b = advanceTicks(createWorld(222), 240);
    expect(a).toEqual(b);
    expect(stateDigest(a)).toBe(stateDigest(b));
  });
});
