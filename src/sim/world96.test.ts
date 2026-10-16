import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { isValidTileAt, tileIndexAt } from './grid';
import { findPath, getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import { createWorld, totalCurrency, walkable } from './world';
import {
  createWorld96, describeWorld96, validateWorld96, WORLD96_DIMENSIONS, type World96Population,
} from './world96';

const SEEDS = [101, 103, 107, 109, 113, 127, 131, 137, 139, 149] as const;
const POPULATIONS = [20, 50, 100] as const;

describe('W02-C: real 96×96 deterministic districts (10 seeds × 3 populations)', () => {
  for (const population of POPULATIONS) for (const seed of SEEDS) {
    it(`seed ${seed}, population ${population}: valid, deterministic, connected and solvent`, () => {
      resetPathfindingDiagnostics();
      const start = performance.now();
      const world = createWorld96(seed, population);
      const durationMs = performance.now() - start;
      const calls = getPathfindingDiagnostics();
      const repeat = createWorld96(seed, population);
      expect(repeat).toEqual(world);
      expect(world.tiles).toHaveLength(9216);
      expect(world.schemaVersion).toBe(6);
      expect(world.map).toEqual({ width: 96, height: 96 });
      expect(world.citizens).toHaveLength(population);
      expect(new Set(world.sites.map(site => site.id)).size).toBe(world.sites.length);
      const market = world.sites.find(site => site.kind === 'market')!;
      const commons = world.sites.find(site => site.kind === 'commons')!;
      const first = world.citizens[0]!;
      const distant = world.resourceNodes.find(node => node.tile.x > 71)!;
      expect(findPath(world, first.tile, market.tile)).not.toBeNull();
      expect(findPath(world, first.tile, commons.tile)).not.toBeNull();
      expect(findPath(world, first.tile, world.sites.find(site => site.id === first.workId)!.tile)).not.toBeNull();
      const across48 = findPath(world, first.tile, distant.tile)!;
      expect(across48.some(tile => tile.x > 48 || tile.y > 48)).toBe(true);
      expect(across48.every(tile => isValidTileAt(tile, WORLD96_DIMENSIONS) && walkable(world, tile))).toBe(true);
      expect(world.resourceNodes.every(node => findPath(world, market.tile, node.tile) !== null)).toBe(true);
      expect(world.citizens.every(citizen => citizen.homeId !== null && citizen.householdId !== null)).toBe(true);
      expect(totalCurrency({ ...createWorld(seed, population) })).toBe(
        world.market.cash + world.citizens.reduce((sum, citizen) => sum + citizen.wallet, 0));
      expect(world.tiles.some(tile => tile === 'water')).toBe(true);
      expect(world.tiles.some(tile => tile === 'forest')).toBe(true);
      expect(world.sites.filter(site => site.kind === 'home')).toHaveLength(25);
      console.log('W02-C generation ' + JSON.stringify({ seed, population, durationMs: +durationMs.toFixed(2),
        ...describeWorld96(world), validationPathCalls: calls }));
    });
  }

  it('keeps the legacy v5 generator, 48x48 dimensions and RNG path unchanged', () => {
    const before = JSON.stringify(createWorld(613, 50));
    const before100 = JSON.stringify(createWorld(149, 100));
    createWorld96(613, 50);
    createWorld96(149, 100);
    expect(JSON.stringify(createWorld(613, 50))).toBe(before);
    expect(JSON.stringify(createWorld(149, 100))).toBe(before100);
    expect(createWorld(613, 50).tiles).toHaveLength(2304);
    expect(createWorld(613, 50).schemaVersion).toBe(5);
    expect(createWorld96(613, 50).map.width).toBe(96);
  });

  it('produces real geographical differences between independent seeds', () => {
    const a = createWorld96(101, 20);
    const b = createWorld96(149, 20);
    expect(a.tiles).not.toEqual(b.tiles);
    expect(a.rngState).not.toBe(b.rngState);
    expect(a.resourceNodes.length).toBe(b.resourceNodes.length);
  });

  it('routes across the 48 boundary, never traverses water, and returns no path across a complete barrier', () => {
    const world = createWorld96(109, 20);
    const origin = world.sites.find(site => site.kind === 'home')!.tile;
    const node = world.resourceNodes.find(item => item.tile.x === 82 && item.tile.y === 7)!;
    const route = findPath(world, origin, node.tile)!;
    expect(route.at(-1)).toEqual(node.tile);
    expect(route.some(tile => tile.x > 48)).toBe(true);
    expect(route.every(tile => walkable(world, tile) && tileIndexAt(tile, WORLD96_DIMENSIONS) !== null)).toBe(true);
    expect(findPath(world, origin, node.tile)).toEqual(route);
    expect(findPath(world, origin, { x: 96, y: 44 })).toBeNull();
    for (let y = 0; y < 96; y += 1) world.tiles[y * 96 + 70] = 'water';
    expect(findPath(world, origin, node.tile)).toBeNull();
  });

  it('rejects corrupted map sizes, overlapping IDs, invalid spawns, broken references and negatives', () => {
    const cases: Array<{ label: string; mutate: (world: ReturnType<typeof createWorld96>) => void }> = [
      { label: 'tiles', mutate: world => { world.tiles.pop(); } },
      { label: 'map', mutate: world => { world.map = { width: 48, height: 48 }; } },
      { label: 'duplicate ID', mutate: world => { world.resourceNodes[0]!.id = world.sites[0]!.id; } },
      { label: 'water spawn', mutate: world => { world.citizens[0]!.tile = { x: 85, y: 26 }; } },
      { label: 'work reference', mutate: world => { world.citizens[0]!.workId = 99999999; } },
      { label: 'household reference', mutate: world => { world.citizens[0]!.householdId = 99999999; } },
      { label: 'currency', mutate: world => { world.market.cash = -1; } },
      { label: 'resource', mutate: world => { world.resourceNodes[0]!.stock = -1; } },
      { label: 'housing', mutate: world => { world.sites.find(site => site.kind === 'home')!.capacity = 0; } },
      { label: 'bad destination', mutate: world => { world.citizens[0]!.destination = { x: 96, y: 1 }; } },
    ];
    for (const testCase of cases) {
      const world = createWorld96(107, 100);
      testCase.mutate(world);
      expect(() => validateWorld96(world), testCase.label).toThrow();
    }
  });

  it('preserves each starting inventory and the actual market currency total from the v5 initializer', () => {
    for (const population of POPULATIONS as readonly World96Population[]) {
      const original = createWorld(127, population);
      const generated = createWorld96(127, population);
      expect(generated.inventory).toEqual(original.inventory);
      expect(generated.market).toEqual(original.market);
      expect(generated.citizens.map(c => c.wallet)).toEqual(original.citizens.map(c => c.wallet));
      expect(generated.citizens.map(c => c.inventory)).toEqual(original.citizens.map(c => c.inventory));
      expect(generated.resourceNodes.map(n => [n.kind, n.capacity, n.stock, n.regenerationPerDay]))
        .toEqual(original.resourceNodes.map(n => [n.kind, n.capacity, n.stock, n.regenerationPerDay]));
    }
  });
});
