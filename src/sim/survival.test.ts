import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { createWorld, getSite, type WorldState } from './world';

function invariants(world: WorldState) {
  expect(world.inventory.food).toBeGreaterThanOrEqual(0);
  expect(world.inventory.wood).toBeGreaterThanOrEqual(0);
  expect(world.inventory.food).toBeLessThanOrEqual(BALANCE.townFoodCapacity);
  expect(world.inventory.wood).toBeLessThanOrEqual(BALANCE.townWoodCapacity);
  for (const node of world.resourceNodes) {
    expect(Number.isInteger(node.stock)).toBe(true);
    expect(node.stock).toBeGreaterThanOrEqual(0);
    expect(node.stock).toBeLessThanOrEqual(node.capacity);
  }
  for (const citizen of world.citizens) {
    for (const need of [citizen.hunger, citizen.energy, citizen.health]) {
      expect(need).toBeGreaterThanOrEqual(0);
      expect(need).toBeLessThanOrEqual(100);
    }
    if (!citizen.alive) {
      expect(citizen.activity).toBe('dead');
      expect(citizen.route).toHaveLength(0);
      expect(citizen.workHours).toBe(0);
    }
    if (citizen.activity === 'atWork') expect(citizen.goal).toBe('work');
    if (citizen.activity === 'rest') expect(citizen.goal).toBe('home');
  }
}

function noSupply() {
  const world = createWorld(12345);
  world.inventory.food = 0;
  for (const node of world.resourceNodes) {
    node.stock = 0;
    node.regenerationPerDay = 0;
  }
  return world;
}

describe('Phase 02 resource accounting and living needs', () => {
  it('decays needs once per simulated hour, clamps needs and cannot conjure food', () => {
    const world = noSupply();
    const first = world.citizens[0]!;
    first.hunger = 99;
    first.energy = 0;
    const after = advanceTicks(world, 24);
    expect(after.citizens[0]!.hunger).toBe(51);
    expect(after.citizens[0]!.energy).toBeGreaterThanOrEqual(0);
    expect(after.inventory.food).toBe(0);
    invariants(after);
  });

  it('resolves two hungry citizens contesting the last food in ascending ID order', () => {
    const world = noSupply();
    world.inventory.food = 1;
    const pantry = world.sites.find((site) => site.kind === 'commons')!.tile;
    for (const citizen of world.citizens.slice(0, 2)) {
      citizen.hunger = 0;
      citizen.needMode = 'food';
      citizen.goal = 'food';
      citizen.activity = 'eating';
      citizen.tile = { ...pantry };
      citizen.destination = { ...pantry };
      citizen.route = [];
    }
    const after = advanceOneTick(world);
    expect(after.inventory.food).toBe(0);
    expect(after.stats.totalFoodConsumed).toBe(1);
    expect(after.citizens[0]!.hunger).toBe(BALANCE.foodNutrition);
    expect(after.citizens[1]!.hunger).toBe(0);
    expect(after.citizens[1]!.activity).toBe('waitingForFood');
    expect(after.events.filter((event) => event.type === 'foodEaten')).toHaveLength(1);
  });

  it('arbitrates last harvestable unit and never produces more than node stock', () => {
    const world = createWorld(12345);
    world.tick = 6;
    world.inventory.food = 0;
    for (const node of world.resourceNodes) node.stock = 0;
    const field = world.resourceNodes.find((node) => node.kind === 'field')!;
    field.stock = 1;
    const farmers = world.citizens.filter((citizen) => citizen.job === 'farmer').slice(0, 2);
    for (const farmer of farmers) {
      farmer.hunger = 100;
      farmer.energy = 100;
      farmer.needMode = null;
      farmer.goal = 'work';
      farmer.activity = 'atWork';
      farmer.workNodeId = field.id;
      farmer.workHours = BALANCE.farmActionHours - 1;
      farmer.tile = { ...field.tile };
      farmer.destination = { ...field.tile };
      farmer.route = [];
    }
    const after = advanceOneTick(world);
    expect(after.resourceNodes.find((node) => node.id === field.id)!.stock).toBe(0);
    expect(after.inventory.food).toBe(1);
    expect(after.stats.totalFoodProduced).toBe(1);
    expect(after.events.filter((event) => event.type === 'foodProduced')).toHaveLength(1);
  });

  it('regenerates fields/wood once daily with hard capacity', () => {
    const world = createWorld(12345);
    world.tick = 23;
    const node = world.resourceNodes[0]!;
    node.stock = node.capacity - 1;
    node.regenerationPerDay = 8;
    for (const citizen of world.citizens) citizen.alive = false;
    const dayChange = advanceOneTick(world);
    expect(dayChange.resourceNodes[0]!.stock).toBe(node.capacity);
    expect(advanceOneTick(dayChange).resourceNodes[0]!.stock).toBe(node.capacity);
    expect(dayChange.stats.day).toBe(2);
  });

  it('prolonged shortage damages health and eventually kills, never immediately', () => {
    const world = noSupply();
    for (const citizen of world.citizens) { citizen.hunger = 0; citizen.health = 100; }
    const firstDay = advanceTicks(world, 24);
    expect(firstDay.citizens.every((citizen) => citizen.alive)).toBe(true);
    expect(firstDay.citizens.every((citizen) => citizen.health === 100)).toBe(true);
    const result = advanceTicks(firstDay, 200);
    expect(result.citizens.some((citizen) => !citizen.alive)).toBe(true);
    expect(result.events.some((event) => event.type === 'death')).toBe(true);
    invariants(result);
    const dead = result.citizens.find((citizen) => !citizen.alive)!;
    const after = advanceTicks(result, 12).citizens.find((citizen) => citizen.id === dead.id)!;
    expect(after).toEqual(dead);
  });

  it('rest and meals are stationary one-hour actions, not movement plus work', () => {
    let world = createWorld(1);
    let sawWork = false;
    let sawMeal = false;
    let sawRest = false;
    for (let step = 0; step < 120; step += 1) {
      world = advanceOneTick(world);
      invariants(world);
      for (const citizen of world.citizens) {
        if (citizen.lastMove.length > 1) expect(citizen.actionDuration).toBe(0);
        if (citizen.activity === 'atWork' && citizen.workHours > 0) sawWork = true;
        if (citizen.activity === 'eating' && citizen.actionDuration === 1) sawMeal = true;
        if (citizen.activity === 'rest' && citizen.actionDuration === 1) sawRest = true;
      }
    }
    expect([sawWork, sawMeal, sawRest]).toEqual([true, true, true]);
  });

  it('10 seeds × 30 days: sustainable, conserved stocks, deterministic 720-hour replay', () => {
    const rows = [];
    for (let seed = 1; seed <= 10; seed += 1) {
      const initial = createWorld(seed);
      const after = advanceTicks(initial, 720);
      invariants(after);
      expect(after.inventory.food).toBe(BALANCE.initialFood + after.stats.totalFoodProduced - after.stats.totalFoodConsumed);
      expect(after.inventory.wood).toBe(BALANCE.initialWood + after.stats.totalWoodProduced);
      expect(after.citizens).toHaveLength(20);
      expect(after.stats.totalFoodProduced).toBeGreaterThan(0);
      expect(after.stats.totalFoodConsumed).toBeGreaterThan(0);
      expect(after.citizens.filter((citizen) => citizen.alive).length).toBeGreaterThanOrEqual(16);
      const again = advanceTicks(createWorld(seed), 720);
      expect(stateDigest(after)).toBe(stateDigest(again));
      expect(after).toEqual(again);
      rows.push({ seed, alive: after.citizens.filter((citizen) => citizen.alive).length,
        food: after.inventory.food, wood: after.inventory.wood,
        produced: after.stats.totalFoodProduced, consumed: after.stats.totalFoodConsumed,
        deaths: after.stats.deaths });
    }
    console.log('PHASE02_BALANCE_TABLE=' + JSON.stringify(rows));
  });

  it('batched ticks equal individual ticks, and different seeds vary', () => {
    const a = advanceTicks(createWorld(22), 120);
    let b = createWorld(22);
    for (let i = 0; i < 120; i += 1) b = advanceOneTick(b);
    expect(a).toEqual(b);
    expect(stateDigest(a)).toBe(stateDigest(b));
    expect(stateDigest(a)).not.toBe(stateDigest(advanceTicks(createWorld(23), 120)));
  });

  it('unreachable workplaces yield safe home fallback without infinite retry', () => {
    const world = createWorld(12345);
    const first = world.citizens[0]!;
    const home = getSite(world, first.homeId).tile;
    for (const node of world.resourceNodes.filter((item) => item.kind === 'field')) {
      world.tiles[node.tile.y * 48 + node.tile.x] = 'water';
    }
    const after = advanceTicks(world, 6);
    expect(after.citizens[0]!.goal).toBe('home');
    expect(after.citizens[0]!.tile).toEqual(home);
    expect(after.citizens[0]!.route).toHaveLength(0);
    expect(after.citizens[0]!.retryAfterTick).toBeGreaterThan(after.tick);
    const later = advanceTicks(after, 5);
    expect(later.citizens[0]!.route).toHaveLength(0);
  });
  it('a woodcutter depletes a real forest, then chooses a second source', () => {
    const world = createWorld(12345);
    world.tick = 6;
    const forests = world.resourceNodes.filter((node) => node.kind === 'forest');
    const [first, second] = forests;
    first!.stock = 1;
    second!.stock = 0;
    const cutter = world.citizens.find((citizen) => citizen.job === 'woodcutter')!;
    cutter.hunger = 100;
    cutter.energy = 100;
    cutter.goal = 'work';
    cutter.activity = 'atWork';
    cutter.workNodeId = first!.id;
    cutter.workHours = BALANCE.woodActionHours - 1;
    cutter.tile = { ...first!.tile };
    cutter.destination = { ...first!.tile };
    cutter.route = [];
    const depleted = advanceOneTick(world);
    expect(depleted.resourceNodes.find((node) => node.id === first!.id)!.stock).toBe(0);
    expect(depleted.events.some((event) => event.type === 'depleted' && event.citizenId === cutter.id)).toBe(true);
    expect(depleted.inventory.wood).toBe(BALANCE.initialWood + 1);
    const restored = { ...depleted, resourceNodes: depleted.resourceNodes.map((node) =>
      node.id === second!.id ? { ...node, stock: 3 } : node) };
    const rerouted = advanceOneTick(restored);
    const movedCutter = rerouted.citizens.find((citizen) => citizen.id === cutter.id)!;
    expect(movedCutter.goal).toBe('work');
    expect(movedCutter.destination).toEqual(second!.tile);
    invariants(rerouted);
  });

  it('critical fatigue takes precedence over scheduled work, then recovers at home', () => {
    const world = createWorld(12345);
    world.tick = 6;
    const resident = world.citizens[0]!;
    resident.energy = 0;
    resident.hunger = 98;
    const after = advanceOneTick(world);
    const resting = after.citizens[0]!;
    expect(resting.goal).toBe('home');
    expect(resting.activity).toBe('rest');
    expect(resting.actionDuration).toBe(1);
    expect(resting.energy).toBe(BALANCE.energyDayRestRecovery);
    expect(resting.workHours).toBe(0);
  });

  it('health only recovers under qualifying rest, never unconditionally', () => {
    const world = noSupply();
    world.tick = 11;
    const resident = world.citizens[0]!;
    resident.health = 49;
    resident.hunger = 100;
    resident.energy = 0;
    const after = advanceOneTick(world);
    expect(after.citizens[0]!.health).toBe(50);
    expect(after.events.some((event) => event.type === 'recovery' && event.citizenId === resident.id)).toBe(true);
    const noRest = noSupply();
    noRest.tick = 11;
    noRest.citizens[0]!.health = 49;
    noRest.citizens[0]!.hunger = 0;
    expect(advanceOneTick(noRest).citizens[0]!.health).toBe(49);
  });

});
