import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { advanceOneTick, stateDigest } from './engine';
import { BALANCE } from './balance';
import { dimensionsOf, totalCurrency, walkable, type WorldState } from './world';
import { createWorld96 } from './world96';
import { findPath, getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import { parseLegacySave, parseSave, serializeSave, validateWorld } from '../persistence/save';
import type { GovernanceCommand } from './governance';

const sha = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const legacyFile = new URL('../../tests/fixtures/legacy-v5-48x48.json.gz.b64', import.meta.url);
const legacyExpected = new URL('../../tests/fixtures/legacy-v5-48x48.expected.json', import.meta.url);
const goldensFile = new URL('../../tests/fixtures/n03a-behavior-goldens.json', import.meta.url);
const goldens = JSON.parse(readFileSync(goldensFile, 'utf8')) as Record<string, unknown>;
const quantile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? 0;
};
const pairDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

type Scenario = {
  key: string;
  start: () => { world: WorldState; pending: GovernanceCommand[] };
};

const scenarios: Scenario[] = [
  {
    key: 'legacy-v5-48-p50-seed613-t720',
    start: () => {
      const raw = gunzipSync(Buffer.from(readFileSync(legacyFile, 'utf8').trim(), 'base64')).toString('utf8');
      const manifest = JSON.parse(readFileSync(legacyExpected, 'utf8')) as { saveSha256: string; worldSha256: string };
      // The existing historical fixture stays byte-for-byte frozen.
      expect(sha(raw)).toBe(manifest.saveSha256);
      const saved = parseLegacySave(raw);
      expect(sha(JSON.stringify(saved.world))).toBe(manifest.worldSha256);
      return { world: saved.world, pending: saved.pending };
    },
  },
  ...([20, 50, 100] as const).map(population => ({
    key: 'v6-96-p' + population + '-seed12345-t0',
    start: () => ({ world: createWorld96(12345, population) as WorldState, pending: [] }),
  })),
];

function ownership(world: WorldState) {
  return {
    cash: totalCurrency(world),
    food: world.inventory.food + world.citizens.reduce((sum, c) => sum + c.inventory.food, 0) +
      world.stats.totalFoodConsumed - world.stats.totalFoodProduced,
    wood: world.inventory.wood + world.citizens.reduce((sum, c) => sum + c.inventory.wood, 0) +
      world.constructions.reduce((sum, site) => sum + site.woodSpent, 0) - world.stats.totalWoodProduced,
  };
}

function assertStep(before: WorldState, world: WorldState, conserved: ReturnType<typeof ownership>): void {
  expect(world.tick).toBe(before.tick + 1);
  expect(ownership(world)).toEqual(conserved);
  expect(world.market.cash).toBeGreaterThanOrEqual(0);
  expect(world.inventory.food).toBeGreaterThanOrEqual(0);
  expect(world.inventory.wood).toBeGreaterThanOrEqual(0);
  const earlier = new Map(before.citizens.map(c => [c.id, c]));
  const width = dimensionsOf(world).width;
  const height = dimensionsOf(world).height;
  for (const citizen of world.citizens) {
    const previous = earlier.get(citizen.id);
    expect(citizen.wallet).toBeGreaterThanOrEqual(0);
    expect(citizen.inventory.food).toBeGreaterThanOrEqual(0);
    expect(citizen.inventory.wood).toBeGreaterThanOrEqual(0);
    expect(citizen.route.length).toBeLessThanOrEqual(width * height);
    expect(citizen.lastMove.length).toBeGreaterThanOrEqual(1);
    expect(citizen.lastMove.length).toBeLessThanOrEqual(BALANCE.moveTilesPerHour + 1);
    if (previous) expect(citizen.lastMove[0]).toEqual(previous.tile);
    expect(citizen.lastMove[citizen.lastMove.length - 1]).toEqual(citizen.tile);
    for (const position of citizen.lastMove) expect(walkable(world, position)).toBe(true);
    for (const position of citizen.route) expect(walkable(world, position)).toBe(true);
    for (let i = 1; i < citizen.lastMove.length; i++) {
      expect(pairDistance(citizen.lastMove[i - 1]!, citizen.lastMove[i]!)).toBe(1);
    }
    let end = citizen.tile;
    for (const point of citizen.route) {
      expect(pairDistance(end, point)).toBe(1);
      end = point;
    }
    if (citizen.route.length) expect(end).toEqual(citizen.destination);
    if (!citizen.alive) {
      expect(citizen.activity).toBe('dead');
      expect(citizen.route).toEqual([]);
    }
    if (previous && !previous.alive) {
      expect(citizen.alive).toBe(false);
      expect(citizen.tile).toEqual(previous.tile);
      expect(citizen.wallet).toBe(previous.wallet);
      expect(citizen.inventory).toEqual(previous.inventory);
      expect(citizen.lastMove).toHaveLength(1);
    }
  }
  const added = world.events.filter(event => event.id >= before.nextEventId);
  for (let i = 0; i < added.length; i++) {
    const event = added[i]!;
    expect(event.tick).toBe(world.tick);
    if (i > 0) expect(event.id).toBe(added[i - 1]!.id + 1);
  }
  expect(world.nextEventId - before.nextEventId).toBeGreaterThanOrEqual(added.length);
}

function selected(world: WorldState, selectedIds: readonly number[]) {
  return selectedIds.map(id => {
    const c = world.citizens.find(item => item.id === id);
    if (!c) throw new Error('Selected citizen disappeared: ' + id);
    return {
      id: c.id, alive: c.alive, goal: c.goal, activity: c.activity,
      tile: c.tile, destination: c.destination, route: c.route, lastMove: c.lastMove,
      reason: c.reason, hunger: c.hunger, health: c.health, energy: c.energy,
      wallet: c.wallet, inventory: c.inventory, blockedGoal: c.blockedGoal,
      retryAfterTick: c.retryAfterTick,
    };
  });
}

function run(scenario: Scenario, profile: boolean) {
  const { world: initial, pending } = scenario.start();
  const selectedIds = initial.citizens.slice(0, 3).map(c => c.id);
  const conserved = ownership(initial);
  let world = initial;
  const trace: unknown[] = [];
  const events: unknown[] = [];
  const checkpoints: unknown[] = [];
  const tickMs: number[] = [];
  const pathCalls: number[] = [];
  const moveCounts: number[] = [];
  const activityHours: Record<string, number> = {};
  const routeLengths: number[] = [];
  let routeBlocked = 0;
  let goalTransitions = 0;
  resetPathfindingDiagnostics();
  for (let step = 0; step < 48; step++) {
    const before = world;
    const callsBefore = getPathfindingDiagnostics();
    const start = performance.now();
    world = advanceOneTick(world, step === 0 ? pending : [], 'bfs');
    const duration = performance.now() - start;
    if (profile) tickMs.push(duration);
    pathCalls.push(getPathfindingDiagnostics() - callsBefore);
    assertStep(before, world, conserved);
    const transitions = world.citizens.filter(c => before.citizens.find(b => b.id === c.id)?.goal !== c.goal).length;
    goalTransitions += transitions;
    const moved = world.citizens.filter(c => c.lastMove.length > 1).length;
    moveCounts.push(moved);
    for (const citizen of world.citizens) activityHours[citizen.activity] = (activityHours[citizen.activity] ?? 0) + 1;
    routeLengths.push(...world.citizens.filter(c => c.route.length > 0).map(c => c.route.length));
    const currentEvents = world.events.filter(e => e.id >= before.nextEventId)
      .map(e => ({ id: e.id, tick: e.tick, type: e.type, citizenId: e.citizenId, reason: e.reason }));
    routeBlocked += currentEvents.filter(e => e.type === 'routeBlocked').length;
    events.push(...currentEvents);
    const projection = {
      tick: world.tick, rngState: world.rngState,
      selected: selected(world, selectedIds),
      events: currentEvents,
      currency: totalCurrency(world),
      failedActions: world.stats.failedActions,
    };
    trace.push(projection);
    if ([1, 12, 24, 36, 48].includes(step + 1)) checkpoints.push(projection);
  }
  const dims = dimensionsOf(world);
  const fixture = {
    seed: initial.seed, schemaVersion: initial.schemaVersion,
    dimensions: [dims.width, dims.height], population: initial.citizens.length,
    initialTick: initial.tick, finalTick: world.tick,
    initialRngState: initial.rngState, finalRngState: world.rngState,
    selectedCitizenIds: selectedIds,
    traceSha256: sha(JSON.stringify(trace)), eventSha256: sha(JSON.stringify(events)),
    finalStateDigest: stateDigest(world),
    checks: { initialCurrency: conserved.cash, finalCurrency: totalCurrency(world),
      initialFailedActions: initial.stats.failedActions, finalFailedActions: world.stats.failedActions,
      routeBlocked, goalTransitions, pathCalls: pathCalls.reduce((a, b) => a + b, 0),
      movedCitizenHours: moveCounts.reduce((a, b) => a + b, 0) },
    checkpoints,
  };
  const pathDurations: number[] = [];
  let reachableDestinations = 0;
  if (profile) {
    for (let i = 0; i < Math.min(32, world.citizens.length); i++) {
      const c = world.citizens[i]!;
      const to = world.sites[i % world.sites.length]!.tile;
      const started = performance.now();
      findPath(world, c.tile, to);
      pathDurations.push(performance.now() - started);
    }
    reachableDestinations = world.citizens.filter(c => findPath(world, c.tile, c.destination) !== null).length;
    console.log('N03A_BASELINE=' + JSON.stringify({
      key: scenario.key, environment: process.platform, architecture: process.arch,
      nodeVersion: process.version, cpuModel: cpus()[0]?.model ?? 'unavailable',
      seed: initial.seed, ticks: 48, population: initial.citizens.length,
      dimensions: [dims.width, dims.height], tickP50Ms: +quantile(tickMs, 0.5).toFixed(3),
      tickP95Ms: +quantile(tickMs, 0.95).toFixed(3),
      pathCallsP50: quantile(pathCalls, 0.5), pathCallsP95: quantile(pathCalls, 0.95),
      isolatedPathP50Ms: +quantile(pathDurations, 0.5).toFixed(3),
      isolatedPathP95Ms: +quantile(pathDurations, 0.95).toFixed(3),
      routeLengthP50: quantile(routeLengths, 0.5), routeLengthP95: quantile(routeLengths, 0.95),
      movingCitizenHours: fixture.checks.movedCitizenHours,
      activityHours, reachableDestinations, destinationTotal: world.citizens.length,
      totalCitizenHours: 48 * initial.citizens.length,
      failedActionsDelta: world.stats.failedActions - initial.stats.failedActions,
      routeBlocked, goalTransitions, sampleCount: pathDurations.length,
      saveBytes: Buffer.byteLength(serializeSave(world), 'utf8'),
    }));
  }
  return { world, fixture };
}

describe('N03-A immutable BFS behavior and routing baseline (explicit compatibility strategy)', () => {
  it('locks the complete four-row golden manifest before evaluating scenarios', () => {
    expect(Object.keys(goldens).sort()).toEqual(scenarios.map(s => s.key).sort());
  });
  for (const scenario of scenarios) {
    it(scenario.key + ': 48-tick golden trace, economy, routes, replay and save/load', () => {
      const { world, fixture } = run(scenario, true);
      console.log('N03A_FIXTURE=' + JSON.stringify({ key: scenario.key, fixture }));
      expect(fixture).toEqual(goldens[scenario.key]);
      const replay = run(scenario, false);
      expect(replay.fixture).toEqual(fixture);
      expect(replay.world).toEqual(world);
      const { world: initial, pending } = scenario.start();
      let split = initial;
      for (let i = 0; i < 24; i++) split = advanceOneTick(split, i === 0 ? pending : [], 'bfs');
      const loaded = split.schemaVersion === 5
        ? parseLegacySave(serializeSave(split)).world
        : parseSave(serializeSave(split)).world;
      expect(loaded).toEqual(split);
      let resumed = loaded;
      for (let i = 0; i < 24; i++) resumed = advanceOneTick(resumed, [], 'bfs');
      expect(resumed).toEqual(world);
      expect(resumed.rngState).toBe(world.rngState);
      expect(resumed.events).toEqual(world.events);
      validateWorld(world);
    }, 120000);
  }
});
