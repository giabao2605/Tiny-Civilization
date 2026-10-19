import { cpus } from 'node:os';
import { describe, expect, it } from 'vitest';
import { BALANCE } from './balance';
import { advanceOneTick, advanceTicks, stateDigest } from './engine';
import { tileIndexAt } from './grid';
import { getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import { getRoutingDiagnostics, resetRoutingDiagnostics } from './routing';
import { getWeightedPathDiagnostics, resetWeightedPathDiagnostics } from './weightedPathfinding';
import { createWorld, dimensionsOf, marketTile, totalCurrency, walkable, type Citizen, type WorldState } from './world';
import { createWorld96 } from './world96';
import { parseSave, serializeSave } from '../persistence/save';

const same = (a: {x: number; y: number}, b: {x: number; y: number}) => a.x === b.x && a.y === b.y;
const pct = (values: number[], portion: number) =>
  [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * portion) - 1)] ?? 0;
const rounded = (n: number) => +n.toFixed(3);
const inventory = (world: WorldState) => ({
  cash: totalCurrency(world),
  food: world.inventory.food + world.citizens.reduce((n, c) => n + c.inventory.food, 0)
    + world.stats.totalFoodConsumed - world.stats.totalFoodProduced,
  wood: world.inventory.wood + world.citizens.reduce((n, c) => n + c.inventory.wood, 0)
    + world.constructions.reduce((n, c) => n + c.woodSpent, 0) - world.stats.totalWoodProduced,
});

/** Observer-only measurement. Timers and diagnostics never enter engine state or the PRNG. */
function observe(size: 48 | 96, count: 20 | 50 | 100, seed: number) {
  let world: WorldState = size === 48 ? createWorld(seed, count) : createWorld96(seed, count);
  const initialBalances = inventory(world);
  const times: number[] = [];
  const activityHours: Record<string, number> = {};
  let npcHours = 0, movingHours = 0, movementTiles = 0, waitingRouteHours = 0;
  let goalChanges = 0, abaOscillations = 0, recoveryRetries = 0;
  let maxWaitingStreak = 0;
  const waitingStreak = new Map<number, number>();
  const olderGoal = new Map<number, Citizen['goal']>();
  resetRoutingDiagnostics();
  resetPathfindingDiagnostics();
  resetWeightedPathDiagnostics();
  const wallStart = performance.now();
  for (let hour = 0; hour < 72; hour++) {
    const previous = world;
    const started = performance.now();
    world = advanceOneTick(world);
    times.push(performance.now() - started);
    const prior = new Map(previous.citizens.map(c => [c.id, c]));
    for (const citizen of world.citizens) {
      const before = prior.get(citizen.id)!;
      if (!same(citizen.lastMove[0]!, before.tile)) throw new Error('start mismatch: ' + citizen.id);
      if (!same(citizen.lastMove.at(-1)!, citizen.tile)) throw new Error('end mismatch: ' + citizen.id);
      if (citizen.lastMove.length > BALANCE.moveTilesPerHour + 1) throw new Error('teleport: ' + citizen.id);
      for (let i = 1; i < citizen.lastMove.length; i++) {
        const prev = citizen.lastMove[i - 1]!, at = citizen.lastMove[i]!;
        if (Math.abs(prev.x - at.x) + Math.abs(prev.y - at.y) !== 1 || !walkable(world, at))
          throw new Error('invalid terrain or movement: ' + citizen.id);
      }
      if (!citizen.alive) {
        if (citizen.activity !== 'dead' || citizen.route.length || citizen.lastMove.length !== 1)
          throw new Error('ghost activity: ' + citizen.id);
        continue;
      }
      if (!citizen.reason.trim()) throw new Error('missing inspector reason: ' + citizen.id);
      npcHours++;
      activityHours[citizen.activity] = (activityHours[citizen.activity] ?? 0) + 1;
      if (citizen.lastMove.length > 1) {
        movingHours++;
        movementTiles += citizen.lastMove.length - 1;
      }
      if (before.goal !== citizen.goal) {
        goalChanges++;
        if (olderGoal.get(citizen.id) === citizen.goal) abaOscillations++;
      }
      olderGoal.set(citizen.id, before.goal);
      if (before.blockedGoal !== null && previous.tick + 1 < before.retryAfterTick &&
          citizen.blockedGoal === before.blockedGoal && citizen.retryAfterTick !== before.retryAfterTick)
        throw new Error('retry cooldown changed early: ' + citizen.id);
      if (before.blockedGoal !== null && previous.tick + 1 >= before.retryAfterTick)
        recoveryRetries++;
      if (citizen.activity === 'waitingForRoute') {
        waitingRouteHours++;
        if (citizen.blockedGoal === null || citizen.retryAfterTick <= world.tick)
          throw new Error('waiting has no active retry: ' + citizen.id);
        const streak = (waitingStreak.get(citizen.id) ?? 0) + 1;
        waitingStreak.set(citizen.id, streak);
        maxWaitingStreak = Math.max(maxWaitingStreak, streak);
      } else waitingStreak.delete(citizen.id);
    }
    if (world.tick % 24 === 0 && JSON.stringify(inventory(world)) !== JSON.stringify(initialBalances))
      throw new Error('ownership conservation changed');
  }
  const d = getRoutingDiagnostics(), w = getWeightedPathDiagnostics();
  const result = {
    size, count, seed, ticks: world.tick, tickP50Ms: rounded(pct(times, 0.5)),
    tickP95Ms: rounded(pct(times, 0.95)), totalWallMs: rounded(performance.now() - wallStart),
    bfsCalls: getPathfindingDiagnostics(), weightedCalls: w.calls, expandedNodes: w.expandedNodes,
    routeRequests: d.calls, unreachableRequests: d.unreachable,
    weightedAccepted: d.weightedAccepted, bfsFallbacks: d.bfsFallbacks,
    routeBlocked: world.events.filter(e => e.type === 'routeBlocked').length,
    npcHours, movingHours, movementDensity: rounded(movingHours / Math.max(1, npcHours)),
    movementTiles, goalChanges, abaOscillations, waitingRouteHours, maxWaitingStreak, recoveryRetries,
    activityHours, foodProduced: world.stats.totalFoodProduced,
    foodConsumed: world.stats.totalFoodConsumed, woodProduced: world.stats.totalWoodProduced,
    trades: world.market.completedTrades, deaths: world.stats.deaths,
    failedActions: world.stats.failedActions, balances: inventory(world),
    node: process.version, platform: process.platform, cpu: cpus()[0]?.model ?? 'unknown',
    note: '72 game hours of actual engine, no Phaser / browser GPU; 720h exhaustive matrix is N03C_SIM_BENCH',
  };
  console.log('N03F_WATCHABILITY', JSON.stringify(result));
  expect(world.tick).toBe(72);
  expect(inventory(world)).toEqual(initialBalances);
  expect(movingHours).toBeGreaterThan(0);
  return result;
}

describe('N03-F deterministic observer validation', () => {
  for (const size of [48, 96] as const) for (const count of [20, 50, 100] as const) {
    it(size + 'x' + size + ', ' + count + ' residents across 72 observable hours', () => {
      // Independent seeded worlds, never a mutable global PRNG or test-only behavior path.
      for (const seed of [101, 107, 12345]) observe(size, count, seed);
    }, 120000);
  }

  it('96x96 save/load and uninterrupted deterministic replay match at 1000 hours', () => {
    const initial = createWorld96(107, 20);
    const direct = advanceTicks(initial, 1000);
    const prefix = advanceTicks(createWorld96(107, 20), 500);
    const restored = parseSave(serializeSave(prefix)).world;
    const resumed = advanceTicks(restored, 500);
    expect(stateDigest(resumed)).toBe(stateDigest(direct));
    expect(resumed).toEqual(direct);
    console.log('N03F_REPLAY', JSON.stringify({ size: 96, count: 20, seed: 107,
      ticks: 1000, midpoint: 500, deterministic: true, format: 'v6' }));
  }, 120000);

  it('measures real blocked cooldown without a routeBlocked storm or ghost travel', () => {
    let world = createWorld96(101, 20);
    const c = world.citizens.find(v => v.job === 'farmer')!;
    const at = marketTile(world);
    const dims = dimensionsOf(world);
    world.tick = 5;
    c.tile = { ...at }; c.destination = { ...at }; c.goal = 'home';
    c.activity = 'rest'; c.route = []; c.hunger = 98; c.energy = 98;
    c.needMode = null; c.lastMove = [{ ...at }];
    for (const p of [{x: at.x - 1, y: at.y}, {x: at.x + 1, y: at.y},
      {x: at.x, y: at.y - 1}, {x: at.x, y: at.y + 1}]) {
      const index = tileIndexAt(p, dims)!;
      world.tiles[index] = 'water';
    }
    let blockedEvents = 0, waitingHours = 0, retryChanges = 0;
    let lastRetry = 0;
    const hours = BALANCE.retryBlockedAfterHours * 2 + 1;
    for (let i = 0; i < hours; i++) {
      const previous = world;
      world = advanceOneTick(world);
      const actor = world.citizens.find(v => v.id === c.id)!;
      blockedEvents += world.events.filter(e => e.id >= previous.nextEventId &&
        e.type === 'routeBlocked' && e.citizenId === c.id).length;
      if (actor.retryAfterTick !== lastRetry && actor.retryAfterTick > 0) retryChanges++;
      lastRetry = actor.retryAfterTick;
      if (actor.activity === 'waitingForRoute') waitingHours++;
      expect(actor.tile).toEqual(at);
      expect(actor.lastMove).toEqual([at]);
      expect(actor.reason.length).toBeGreaterThan(0);
    }
    console.log('N03F_BLOCKED_SOAK', JSON.stringify({
      elapsedHours: hours, blockedEvents, waitingHours, retryChanges,
      retryCooldown: BALANCE.retryBlockedAfterHours,
      note: 'Synthetic isolated island; not a valid production save',
    }));
    expect(blockedEvents).toBeLessThanOrEqual(1 + Math.ceil(hours / BALANCE.retryBlockedAfterHours));
    expect(waitingHours).toBeGreaterThan(0);
  }, 120000);
});
