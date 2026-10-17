import { cpus } from 'node:os';
import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, advanceTicks } from './engine';
import { getPathfindingDiagnostics, resetPathfindingDiagnostics, findPath } from './pathfinding';
import {
  defaultRoutingStrategy, getRoutingDiagnostics, resetRoutingDiagnostics, type RoutingStrategy,
} from './routing';
import { getWeightedPathDiagnostics, resetWeightedPathDiagnostics, findWeightedPath,
  traversalCostX10 } from './weightedPathfinding';
import { dimensionsOf, createWorld, marketTile, totalCurrency, walkable, type WorldState } from './world';
import { createWorld96 } from './world96';
import { parseSave, serializeSave, validateWorld } from '../persistence/save';
import type { TilePosition } from './grid';

const seeds = [101, 107, 12345] as const;
const populations = [20, 50, 100] as const;
const quantile = (values: number[], p: number): number =>
  [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * p) - 1)] ?? 0;
const fixed = (value: number): number => +value.toFixed(3);
const same = (a: TilePosition, b: TilePosition) => a.x === b.x && a.y === b.y;
const distance = (a: TilePosition, b: TilePosition): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function physicalBalances(world: WorldState) {
  return {
    currency: totalCurrency(world),
    food: world.inventory.food + world.citizens.reduce((n, c) => n + c.inventory.food, 0) +
      world.stats.totalFoodConsumed - world.stats.totalFoodProduced,
    wood: world.inventory.wood + world.citizens.reduce((n, c) => n + c.inventory.wood, 0) +
      world.constructions.reduce((n, c) => n + c.woodSpent, 0) - world.stats.totalWoodProduced,
  };
}

function assertSimulationInvariants(previous: WorldState, world: WorldState,
  balances: ReturnType<typeof physicalBalances>): void {
  expect(world.tick).toBe(previous.tick + 1);
  expect(physicalBalances(world)).toEqual(balances);
  expect(world.market.cash).toBeGreaterThanOrEqual(0);
  expect(world.inventory.food).toBeGreaterThanOrEqual(0);
  expect(world.inventory.wood).toBeGreaterThanOrEqual(0);
  const prior = new Map(previous.citizens.map(c => [c.id, c]));
  const { width, height } = dimensionsOf(world);
  const seen = new Set<number>();
  for (const resident of world.citizens) {
    const before = prior.get(resident.id);
    expect(seen.has(resident.id)).toBe(false);
    seen.add(resident.id);
    expect(resident.wallet).toBeGreaterThanOrEqual(0);
    expect(resident.inventory.food).toBeGreaterThanOrEqual(0);
    expect(resident.inventory.wood).toBeGreaterThanOrEqual(0);
    for (const need of [resident.energy, resident.health, resident.hunger]) {
      expect(need).toBeGreaterThanOrEqual(0);
      expect(need).toBeLessThanOrEqual(100);
    }
    expect(resident.lastMove.length).toBeGreaterThanOrEqual(1);
    expect(resident.lastMove.length).toBeLessThanOrEqual(BALANCE.moveTilesPerHour + 1);
    if (before) expect(resident.lastMove[0]).toEqual(before.tile);
    expect(resident.lastMove.at(-1)).toEqual(resident.tile);
    let at = resident.lastMove[0]!;
    for (const step of resident.lastMove.slice(1)) {
      expect(distance(at, step)).toBe(1);
      expect(walkable(world, step)).toBe(true);
      at = step;
    }
    expect(walkable(world, resident.tile)).toBe(true);
    expect(resident.route.length).toBeLessThanOrEqual(width * height);
    at = resident.tile;
    for (const step of resident.route) {
      expect(step.x).toBeGreaterThanOrEqual(0);
      expect(step.x).toBeLessThan(width);
      expect(step.y).toBeGreaterThanOrEqual(0);
      expect(step.y).toBeLessThan(height);
      expect(distance(at, step)).toBe(1);
      expect(walkable(world, step)).toBe(true);
      at = step;
    }
    if (resident.route.length) expect(at).toEqual(resident.destination);
    if (before && !before.alive) {
      expect(resident.alive).toBe(false);
      expect(resident.tile).toEqual(before.tile);
      expect(resident.inventory).toEqual(before.inventory);
      expect(resident.wallet).toBe(before.wallet);
      expect(resident.lastMove).toHaveLength(1);
    }
    if (!resident.alive) {
      expect(resident.activity).toBe('dead');
      expect(resident.route).toEqual([]);
    }
  }
  for (const node of world.resourceNodes) {
    expect(node.stock).toBeGreaterThanOrEqual(0);
    expect(node.stock).toBeLessThanOrEqual(node.capacity);
  }
  // Trades may have been truncated from the bounded history; the retained ones
  // from this tick still require an actor who was alive and at the real market.
  for (const trade of world.market.trades.filter(t => t.tick === world.tick)) {
    const buyer = prior.get(trade.citizenId);
    const after = world.citizens.find(c => c.id === trade.citizenId);
    expect(buyer?.alive).toBe(true);
    expect(after).toBeDefined();
    expect(after!.tile).toEqual(marketTile(world));
    expect(trade.quantity).toBeGreaterThan(0);
    expect(trade.amount).toBeGreaterThan(0);
  }
  const emitted = world.events.filter(event => event.id >= previous.nextEventId);
  for (let i = 0; i < emitted.length; i++) {
    expect(emitted[i]!.tick).toBe(world.tick);
    if (i > 0) expect(emitted[i]!.id).toBe(emitted[i - 1]!.id + 1);
  }
}

type Sample = {
  size: 48 | 96; count: 20 | 50 | 100; seed: number; strategy: RoutingStrategy;
  tickP50Ms: number; tickP95Ms: number; runtimeMs: number;
  bfsCalls: number; weightedCalls: number; expandedNodes: number;
  routeRequests: number; unreachableRequests: number;
  movementTiles: number; weightedMovementCostX10: number; remainingRouteP50: number;
  workHours: number; travelHours: number; trades: number; failedActions: number;
  producedFood: number; producedWood: number; consumedFood: number;
  deaths: number; starving: number; averageHunger: number;
  marketCash: number; marketFood: number; marketWood: number;
  blockedEvents: number; goalChanges: number; rngState: number;
};
function simulate(size: 48 | 96, count: 20 | 50 | 100, seed: number,
  strategy: RoutingStrategy): { world: WorldState; sample: Sample } {
  let world: WorldState = size === 48 ? createWorld(seed, count) : createWorld96(seed, count);
  const startingBalances = physicalBalances(world);
  resetPathfindingDiagnostics();
  resetWeightedPathDiagnostics();
  resetRoutingDiagnostics();
  const times: number[] = [], lengths: number[] = [];
  const roadCosts = new Map<number, number>();
  if (world.schemaVersion === 6 && world.layout) {
    const width = world.map.width;
    for (const road of world.layout.roads) {
      const cost = road.kind === 'footpath' ? 12 : road.kind === 'side' ? 11 : 10;
      roadCosts.set(road.tile.y * width + road.tile.x, cost);
    }
  }
  const travelCost = (at: TilePosition): number => {
    const { width } = dimensionsOf(world);
    const index = at.y * width + at.x;
    const terrain = world.tiles[index];
    return terrain === 'road' ? roadCosts.get(index) ?? 10 : terrain === 'forest' ? 25 : 20;
  };
  let travelTiles = 0, totalCost = 0, blockedEvents = 0, goalChanges = 0;
  let workHours = 0, travelHours = 0;
  const started = performance.now();
  for (let step = 0; step < 720; step++) {
    const before = world;
    const tickStart = performance.now();
    world = advanceOneTick(before, [], strategy);
    times.push(performance.now() - tickStart);
    assertSimulationInvariants(before, world, startingBalances);
    const old = new Map(before.citizens.map(c => [c.id, c]));
    for (const citizen of world.citizens) {
      if (citizen.activity === 'atWork' || citizen.activity === 'building') workHours += 1;
      if (citizen.activity.startsWith('travel')) travelHours += 1;
      if (citizen.route.length) lengths.push(citizen.route.length);
      if (old.has(citizen.id) && old.get(citizen.id)!.goal !== citizen.goal) goalChanges += 1;
      for (const tile of citizen.lastMove.slice(1)) {
        travelTiles += 1;
        totalCost += travelCost(tile);
      }
    }
    blockedEvents += world.events.filter(e => e.id >= before.nextEventId && e.type === 'routeBlocked').length;
  }
  const runtime = performance.now() - started;
  const counters = getRoutingDiagnostics();
  const weighted = getWeightedPathDiagnostics();
  const alive = world.citizens.filter(c => c.alive);
  const sample: Sample = {
    size, count, seed, strategy,
    tickP50Ms: fixed(quantile(times, 0.5)), tickP95Ms: fixed(quantile(times, 0.95)),
    runtimeMs: fixed(runtime),
    bfsCalls: getPathfindingDiagnostics(), weightedCalls: weighted.calls,
    expandedNodes: weighted.expandedNodes,
    routeRequests: counters.calls, unreachableRequests: counters.unreachable,
    movementTiles: travelTiles, weightedMovementCostX10: totalCost,
    remainingRouteP50: quantile(lengths, 0.5),
    workHours, travelHours, trades: world.market.completedTrades,
    failedActions: world.stats.failedActions,
    producedFood: world.stats.totalFoodProduced, producedWood: world.stats.totalWoodProduced,
    consumedFood: world.stats.totalFoodConsumed,
    deaths: world.stats.deaths, starving: alive.filter(c => c.hunger <= BALANCE.criticalHunger).length,
    averageHunger: fixed(alive.reduce((n, c) => n + c.hunger, 0) / Math.max(1, alive.length)),
    marketCash: world.market.cash, marketFood: world.inventory.food, marketWood: world.inventory.wood,
    blockedEvents, goalChanges, rngState: world.rngState,
  };
  console.log('N03C_SIM_BENCH', JSON.stringify({
    ...sample, node: process.version, platform: process.platform, cpu: cpus()[0]?.model ?? 'unknown',
    method: '720 tick same-process baseline/weighted; clock surrounds engine only; CI timings noisy',
    physicalWindows: 'PARTIAL',
  }));
  return { world, sample };
}

describe('N03-C deterministic routing integration and legacy compatibility', () => {
  it('defaults 96x96 to weighted and preserves v5 and migrated v6 48x48 BFS', () => {
    const v5 = createWorld(613, 50);
    const migrated = parseSave(serializeSave(v5)).world;
    const modern = createWorld96(12345, 20);
    expect(defaultRoutingStrategy(v5)).toBe('bfs');
    expect(defaultRoutingStrategy(migrated)).toBe('bfs');
    expect(defaultRoutingStrategy(modern)).toBe('weighted');
    expect(advanceTicks(createWorld(613, 50), 24)).toEqual(advanceTicks(v5, 24, 'bfs'));
    expect(advanceTicks(migrated, 24)).toEqual(advanceTicks(parseSave(serializeSave(v5)).world, 24, 'bfs'));
    resetWeightedPathDiagnostics();
    const automatic = advanceTicks(createWorld96(12345, 20), 24);
    expect(getWeightedPathDiagnostics().calls).toBeGreaterThan(0);
    expect(automatic).toEqual(advanceTicks(createWorld96(12345, 20), 24, 'weighted'));
  }, 120000);

  it('actually follows the weighted optimum in a production NPC departure', () => {
    let before: WorldState = createWorld96(12345, 50);
    let checked = 0, improvement = 0;
    for (let t = 0; t < 48; t++) {
      const after: WorldState = advanceOneTick(before);
      for (const actor of after.citizens) {
        const prior = before.citizens.find(c => c.id === actor.id);
        if (!prior || !prior.alive || !actor.alive ||
          same(prior.destination, actor.destination) && prior.goal === actor.goal ||
          actor.route.length + actor.lastMove.length <= 1) continue;
        const weighted = findWeightedPath(before, prior.tile, actor.destination);
        const bfs = findPath(before, prior.tile, actor.destination);
        if (!weighted || !bfs) continue;
        // The first four steps are already consumed by the authoritative tick.
        expect([...actor.lastMove.slice(1), ...actor.route]).toEqual(weighted);
        const weightedCost = weighted.reduce((n, p) => n + traversalCostX10(before, p)!, 0);
        const bfsCost = bfs.reduce((n, p) => n + traversalCostX10(before, p)!, 0);
        expect(weightedCost).toBeLessThanOrEqual(bfsCost);
        if (weightedCost < bfsCost) improvement += 1;
        checked += 1;
      }
      before = after;
    }
    expect(checked).toBeGreaterThan(0);
    expect(improvement).toBeGreaterThan(0);
  }, 120000);

  for (const count of [20, 100] as const) {
    it('96x96 save/load mid-route gives the same weighted future at ' + count + ' NPC', () => {
      const starting = createWorld96(12345, count);
      let midway = advanceTicks(starting, 8);
      // The save captures an actual traveling NPC, not an empty/tick-zero route.
      if (!midway.citizens.some(c => c.route.length > 0))
        midway = advanceTicks(midway, 1);
      expect(midway.citizens.some(c => c.route.length > 0)).toBe(true);
      const initialString = JSON.stringify(midway);
      const saved = serializeSave(midway);
      const loaded = parseSave(saved).world;
      expect(loaded).toEqual(midway);
      expect(JSON.stringify(midway)).toBe(initialString);
      const uninterrupted = advanceTicks(midway, 48);
      const restored = advanceTicks(loaded, 48);
      expect(restored).toEqual(uninterrupted);
      expect(restored.rngState).toBe(uninterrupted.rngState);
      expect(restored.events).toEqual(uninterrupted.events);
      validateWorld(restored);
    }, 120000);
  }
});

describe('N03-C 30-game-day multiseed matrix with paired BFS comparison', () => {
  for (const size of [48, 96] as const) for (const count of populations) {
    it(size + 'x' + size + ' / ' + count + ' NPC / 3 seeds / 720 ticks', () => {
      for (const seed of seeds) {
        const baseline = simulate(size, count, seed, 'bfs');
        expect(baseline.world.tick).toBe(720);
        if (size === 48) {
          expect(baseline.sample.weightedCalls).toBe(0);
          continue;
        }
        const candidate = simulate(size, count, seed, 'weighted');
        expect(candidate.world.tick).toBe(720);
        expect(candidate.sample.weightedCalls).toBeGreaterThan(0);
        expect(candidate.sample.routeRequests).toBeGreaterThan(0);
        expect(totalCurrency(candidate.world)).toBe(totalCurrency(baseline.world));
        // Economic totals and deaths need NOT be identical when routes differ.
        // Differences are logged for paired investigation, not silently retuned.
        console.log('N03C_PAIRED_IMPACT', JSON.stringify({
          size, count, seed,
          tickP95DeltaMs: fixed(candidate.sample.tickP95Ms - baseline.sample.tickP95Ms),
          deathsDelta: candidate.sample.deaths - baseline.sample.deaths,
          failedActionsDelta: candidate.sample.failedActions - baseline.sample.failedActions,
          tradesDelta: candidate.sample.trades - baseline.sample.trades,
          foodProducedDelta: candidate.sample.producedFood - baseline.sample.producedFood,
          woodProducedDelta: candidate.sample.producedWood - baseline.sample.producedWood,
          blockedDelta: candidate.sample.blockedEvents - baseline.sample.blockedEvents,
          starvationDelta: candidate.sample.starving - baseline.sample.starving,
          rngMayDivergeFromLegitimateSocialEncounters: true,
        }));
      }
    }, 900000);
  }
});
