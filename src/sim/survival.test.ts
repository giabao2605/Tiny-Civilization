import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { createWorld, getSite, marketTile } from './world';

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
    // A bankrupt farmer can choose legal self-sufficiency instead of attempting an illegal purchase.
    expect(after.citizens[0]!.wallet).toBe(0);
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


  it('two farmers contested last harvest unit: only one owned food is created', () => {
    const w = createWorld(12345);
    w.tick = 6;
    w.inventory.food = 0;
    for (const node of w.resourceNodes) node.stock = 0;
    const field = w.resourceNodes.find((n) => n.kind === 'field')!;
    field.stock = 1;
    const farmers = w.citizens.filter((c) => c.job === 'farmer').slice(0, 2);
    for (const farmer of farmers) {
      farmer.hunger = 100; farmer.energy = 100; farmer.needMode = null;
      farmer.goal = 'work'; farmer.activity = 'atWork'; farmer.workNodeId = field.id;
      farmer.workHours = BALANCE.farmActionHours - 1;
      farmer.tile = { ...field.tile }; farmer.destination = { ...field.tile }; farmer.route = [];
    }
    const after = advanceOneTick(w);
    expect(after.resourceNodes.find((n) => n.id === field.id)!.stock).toBe(0);
    expect(after.stats.totalFoodProduced).toBe(1);
    expect(after.citizens.find((c) => c.id === farmers[0]!.id)!.inventory.food).toBe(1);
    expect(after.citizens.find((c) => c.id === farmers[1]!.id)!.inventory.food).toBe(0);
    expect(after.events.filter((e) => e.type === 'foodProduced')).toHaveLength(1);
  });

  it('unreachable fields safely fall back and respect blocked-work cooldown', () => {
    const w = createWorld(12345);
    w.tick = 6;
    const farmer = w.citizens[0]!;
    const home = { ...getSite(w, farmer.homeId).tile };
    for (const field of w.resourceNodes.filter((node) => node.kind === 'field')) {
      w.tiles[field.tile.y * 48 + field.tile.x] = 'water';
    }
    const after = advanceOneTick(w).citizens[0]!;
    expect(after.goal).toBe('home');
    expect(after.tile).toEqual(home);
    expect(after.route).toHaveLength(0);
    expect(after.blockedGoal).toBe('work');
    expect(after.retryAfterTick).toBeGreaterThan(7);
    const later = advanceTicks(w, 6).citizens[0]!;
    expect(later.route).toHaveLength(0);
    expect(later.tile).toEqual(home);
  });

  it('woodcutters deplete actual forest stock then reach a different forest when work resumes', () => {
    const w = createWorld(12345);
    w.tick = 6;
    const [first, second] = w.resourceNodes.filter((n) => n.kind === 'forest');
    first!.stock = 1; second!.stock = 0;
    const cutter = w.citizens.find((c) => c.job === 'woodcutter')!;
    cutter.hunger = 100; cutter.energy = 100;
    cutter.goal = 'work'; cutter.activity = 'atWork'; cutter.workNodeId = first!.id;
    cutter.workHours = BALANCE.woodActionHours - 1;
    cutter.tile = { ...first!.tile }; cutter.destination = { ...first!.tile }; cutter.route = [];
    const depleted = advanceOneTick(w);
    expect(depleted.resourceNodes.find((n) => n.id === first!.id)!.stock).toBe(0);
    expect(depleted.citizens.find((c) => c.id === cutter.id)!.inventory.wood).toBe(1);
    expect(depleted.events.some((e) => e.type === 'depleted' && e.citizenId === cutter.id)).toBe(true);
    // Fixture transfers the produced unit to market ownership to isolate rerouting behavior.
    const resumed = {
      ...depleted,
      inventory: { ...depleted.inventory, wood: depleted.inventory.wood + 1 },
      citizens: depleted.citizens.map((c) => c.id === cutter.id ?
        { ...c, inventory: { ...c.inventory, wood: 0 } } : c),
      resourceNodes: depleted.resourceNodes.map((n) => n.id === second!.id ? { ...n, stock: 3 } : n),
    };
    const rerouted = advanceOneTick(resumed);
    const moved = rerouted.citizens.find((c) => c.id === cutter.id)!;
    expect(moved.goal).toBe('work');
    expect(moved.destination).toEqual(second!.tile);
  });

  it('health recovery needs qualifying stationary rest and never occurs for a starving commuter', () => {
    const w = noSupply();
    w.tick = 11;
    const citizen = w.citizens[0]!;
    citizen.health = 49; citizen.hunger = 100; citizen.energy = 0;
    const after = advanceOneTick(w);
    expect(after.citizens[0]!.health).toBe(50);
    expect(after.events.some((e) => e.type === 'recovery' && e.citizenId === citizen.id)).toBe(true);
    const empty = noSupply();
    empty.tick = 11; empty.citizens[0]!.health = 49; empty.citizens[0]!.hunger = 0;
    expect(advanceOneTick(empty).citizens[0]!.health).toBe(49);
  });

  it('critical health causes persistent medical rest and a different seed diverges', () => {
    const w = createWorld(12345);
    w.tick = 6;
    const c = w.citizens[0]!;
    c.health = 20; c.energy = 100; c.hunger = 100;
    const after = advanceOneTick(w);
    expect(after.citizens[0]!.goal).toBe('home');
    expect(after.citizens[0]!.needMode).toBe('rest');
    const again = advanceOneTick(after);
    expect(again.citizens[0]!.goal).toBe('home');
    expect(again.citizens[0]!.needMode).toBe('rest');
    expect(stateDigest(advanceTicks(createWorld(22), 120))).not.toBe(stateDigest(advanceTicks(createWorld(23), 120)));
  });

  it('pure deterministic survival replay, no FPS or wall-clock dependency', () => {
    const a = advanceTicks(createWorld(222), 240);
    const b = advanceTicks(createWorld(222), 240);
    expect(a).toEqual(b);
    expect(stateDigest(a)).toBe(stateDigest(b));
  });
});
