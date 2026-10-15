import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { advanceOneTick } from './engine';
import { foodAidRejection, type GovernanceCommand } from './governance';
import { MAX_SAVE_BYTES, serializeSave } from '../persistence/save';
import { createWorld, housing, totalCurrency, type WorldState } from './world';

function assertSafeWorld(world: WorldState, initialMoney: number, startingFood: number, startingWood: number) {
  expect(totalCurrency(world)).toBe(initialMoney);
  expect(world.market.cash).toBeGreaterThanOrEqual(0);
  expect(world.inventory.food).toBeGreaterThanOrEqual(0);
  expect(world.inventory.wood).toBeGreaterThanOrEqual(0);
  const seen = new Set(world.citizens.map(c => c.id));
  const heldFood = world.inventory.food + world.citizens.reduce((sum, c) => sum + c.inventory.food, 0);
  const heldWood = world.inventory.wood + world.citizens.reduce((sum, c) => sum + c.inventory.wood, 0);
  expect(heldFood + world.stats.totalFoodConsumed).toBe(startingFood + world.stats.totalFoodProduced);
  expect(heldWood + world.constructions.reduce((sum, c) => sum + c.woodSpent, 0))
    .toBe(startingWood + world.stats.totalWoodProduced);
  expect(world.events.length).toBeLessThanOrEqual(120);
  for (const c of world.citizens) {
    expect(c.wallet).toBeGreaterThanOrEqual(0);
    expect(c.inventory.food).toBeGreaterThanOrEqual(0);
    expect(c.inventory.wood).toBeGreaterThanOrEqual(0);
    expect(c.recent.length).toBeLessThanOrEqual(8);
    expect(c.route.length).toBeLessThanOrEqual(48 * 48);
    if (!c.alive) {
      expect(c.activity).toBe('dead');
      expect(c.route).toEqual([]);
      expect(c.workNodeId).toBeNull();
      expect(c.workHours).toBe(0);
    }
    for (const ref of Object.keys(c.relations)) expect(seen.has(Number(ref))).toBe(true);
  }
}

function percentile(values: number[], p: number): number {
  const copy = [...values].sort((a, b) => a - b);
  return copy[Math.min(copy.length - 1, Math.max(0, Math.ceil(copy.length * p) - 1))] ?? 0;
}
type Report = {
  population: number; seed: number; scenario: string; ticks: number; days: number;
  alive: number; deaths: number; foodStockoutDays: number; hungryChildren: number;
  homeless: number; meanHealth: number; marketCash: number; marketFood: number;
  policyTransferred: number; harvests: number; illness: number; eventsGenerated: number;
  saveBytes: number; tickP50Ms: number; tickP95Ms: number; wallMs: number; heapDeltaBytes: number;
};

function benchmark(seed: number, population: 20 | 50 | 100, scenario: 'normal' | 'low-reserve' | 'famine', ticks: number): Report {
  let world = createWorld(seed, population);
  if (scenario === 'low-reserve') world = { ...world, inventory: { ...world.inventory, food: 0 } };
  if (scenario === 'famine') world = {
    ...world, inventory: { ...world.inventory, food: 0 },
    resourceNodes: world.resourceNodes.map(node => node.kind === 'field'
      ? { ...node, stock: 0, regenerationPerDay: 0 } : node),
  };
  const startingFood = world.inventory.food;
  const startingWood = world.inventory.wood;
  const initialMoney = totalCurrency(world);
  const beforeHeap = process.memoryUsage().heapUsed;
  const start = performance.now();
  const durations: number[] = [];
  let stockoutDays = 0;
  let requestId = 1;
  for (let i = 0; i < ticks; i += 1) {
    const nextTick = world.tick + 1;
    const leader = world.governance.leaderId;
    let commands: GovernanceCommand[] = [];
    if (nextTick % 24 === 0 && leader !== null &&
      foodAidRejection({ ...world, tick: nextTick }, leader, nextTick) === null) {
      commands = [{ type: 'emergency-food', leaderId: leader, issuedTick: nextTick, requestId: requestId++ }];
    }
    const t = performance.now();
    world = advanceOneTick(world, commands);
    durations.push(performance.now() - t);
    if (world.tick % 24 === 0 && world.inventory.food === 0) stockoutDays += 1;
    if (world.tick % 24 === 0) assertSafeWorld(world, initialMoney, startingFood, startingWood);
  }
  const wallMs = performance.now() - start;
  const heapDeltaBytes = process.memoryUsage().heapUsed - beforeHeap;
  const live = world.citizens.filter(c => c.alive);
  const json = serializeSave(world);
  const saveBytes = new TextEncoder().encode(json).byteLength;
  expect(saveBytes).toBeLessThan(MAX_SAVE_BYTES);
  assertSafeWorld(world, initialMoney, startingFood, startingWood);
  return {
    population, seed, scenario, ticks, days: Math.floor(world.tick / 24),
    alive: live.length, deaths: world.stats.deaths, foodStockoutDays: stockoutDays,
    hungryChildren: live.filter(c => c.age < 18 && c.hunger <= 55).length,
    homeless: housing(world).homeless,
    meanHealth: live.length ? Math.round(live.reduce((a, c) => a + c.health, 0) / live.length) : 0,
    marketCash: world.market.cash, marketFood: world.inventory.food,
    policyTransferred: world.governance.policy.transferred,
    harvests: world.governance.harvestCount, illness: world.governance.illnessCount,
    eventsGenerated: world.nextEventId - 2,
    saveBytes, tickP50Ms: +percentile(durations, 0.5).toFixed(3),
    tickP95Ms: +percentile(durations, 0.95).toFixed(3),
    wallMs: +wallMs.toFixed(1), heapDeltaBytes,
  };
}

describe('Phase 06 measured stress and balance reports (Node, not browser FPS)', () => {
  it('benchmarks all population tiers with 1000 ticks and engine time distributions', () => {
    const result = ([20, 50, 100] as const).map(population => benchmark(543, population, 'normal', 1000));
    console.log('PHASE06_PERFORMANCE=' + JSON.stringify(result));
    expect(result).toHaveLength(3);
  }, 180000);

  it('compares 10 seeded 30-day normal, low-reserve and non-regenerating famine scenarios', () => {
    const seeds = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149];
    const results: Report[] = [];
    for (const seed of seeds) {
      results.push(benchmark(seed, 100, 'normal', 720));
      results.push(benchmark(seed, 100, 'low-reserve', 720));
      results.push(benchmark(seed, 100, 'famine', 720));
    }
    console.log('PHASE06_BALANCE=' + JSON.stringify(results));
    expect(results).toHaveLength(30);
    expect(results.filter(r => r.scenario === 'famine').every(r => r.foodStockoutDays >= 25)).toBe(true);
    expect(results.every(r => r.harvests > 0 && r.illness > 0 && r.days >= 30)).toBe(true);
  }, 180000);
});
