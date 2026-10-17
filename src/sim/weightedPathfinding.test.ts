import { describe, expect, it } from 'vitest';
import type { TilePosition } from './grid';
import { createWorld, type Terrain } from './world';
import { createWorld96 } from './world96';
import { findPath, getPathfindingDiagnostics, resetPathfindingDiagnostics } from './pathfinding';
import {
  findWeightedPath, traversalCostX10, getWeightedPathDiagnostics,
  resetWeightedPathDiagnostics, type WeightedWorld, type WeightedPathStats,
} from './weightedPathfinding';

function p(x: number, y: number): TilePosition { return { x, y }; }
function miniature(rows: string[], roads: Array<{ tile: TilePosition; kind: 'main' | 'side' | 'footpath' | 'plaza' }> = []): WeightedWorld {
  const types: Record<string, Terrain> = { r: 'road', g: 'grass', f: 'forest', w: 'water' };
  return { schemaVersion: 6, map: { width: rows[0]!.length, height: rows.length },
    tiles: rows.join('').split('').map(ch => types[ch]!), layout: { roads } };
}
function cost(world: WeightedWorld, route: TilePosition[]): number {
  return route.reduce((total, tile) => total + traversalCostX10(world, tile)!, 0);
}
function assertCardinal(world: WeightedWorld, start: TilePosition, end: TilePosition, route: TilePosition[]): void {
  let position = start;
  for (const step of route) {
    expect(Math.abs(position.x - step.x) + Math.abs(position.y - step.y)).toBe(1);
    expect(traversalCostX10(world, step)).toBeGreaterThan(0);
    position = step;
  }
  expect(position).toEqual(end);
}
/** Independent slow Dijkstra oracle, test-only and intentionally no A* heuristic/heap. */
function dijkstra(world: WeightedWorld, start: TilePosition, end: TilePosition): number | null {
  const width = world.schemaVersion === 5 ? 48 : world.map.width;
  const height = world.schemaVersion === 5 ? 48 : world.map.height;
  const inside = (tile: TilePosition) => tile.x >= 0 && tile.y >= 0 && tile.x < width && tile.y < height;
  if (!inside(start) || !inside(end) || traversalCostX10(world, start) === null ||
      traversalCostX10(world, end) === null) return null;
  const index = (tile: TilePosition) => tile.y * width + tile.x;
  const distances = new Array<number>(width * height).fill(Infinity);
  const done = new Set<number>();
  distances[index(start)] = 0;
  while (true) {
    let active = -1;
    for (let i = 0; i < distances.length; i += 1) {
      if (!done.has(i) && Number.isFinite(distances[i]!) &&
          (active === -1 || distances[i]! < distances[active]!)) active = i;
    }
    if (active < 0) return null;
    if (active === index(end)) return distances[active]!;
    done.add(active);
    const x = active % width, y = Math.floor(active / width);
    for (const next of [p(x, y - 1), p(x + 1, y), p(x, y + 1), p(x - 1, y)]) {
      if (!inside(next)) continue;
      const edge = traversalCostX10(world, next);
      if (edge === null) continue;
      distances[index(next)] = Math.min(distances[index(next)]!, distances[active]! + edge);
    }
  }
}

describe('N03-B weighted A* independent of production behavior', () => {
  it('handles same tile, OOB, water, malformed size and unreachable', () => {
    const world = miniature(['grw', 'www', 'wrg']);
    expect(findWeightedPath(world, p(0, 0), p(0, 0))).toEqual([]);
    expect(findWeightedPath(world, p(-1, 0), p(0, 0))).toBeNull();
    expect(findWeightedPath(world, p(0, 0), p(3, 0))).toBeNull();
    expect(findWeightedPath(world, p(2, 0), p(2, 0))).toBeNull();
    expect(findWeightedPath(world, p(0, 0), p(2, 2))).toBeNull();
    expect(findWeightedPath({ ...world, tiles: [] }, p(0, 0), p(0, 0))).toBeNull();
  });

  it('takes a longer cheap road detour, unlike geometric BFS', () => {
    const world = miniature(['rrrrrrr', 'ggggggg', 'fffffff']);
    const start = p(0, 1), end = p(6, 1);
    const route = findWeightedPath(world, start, end)!;
    const bfs = findPath(world, start, end)!;
    expect(route.length).toBeGreaterThan(bfs.length);
    expect(cost(world, route)).toBe(90);
    expect(cost(world, route)).toBeLessThan(cost(world, bfs));
    assertCardinal(world, start, end, route);
  });

  it('applies subtype only to real roads; water/grass and POIs stay authoritative', () => {
    const world = miniature(['rrr', 'wgr'], [
      { tile: p(0, 0), kind: 'main' }, { tile: p(1, 0), kind: 'side' },
      { tile: p(2, 0), kind: 'footpath' }, { tile: p(0, 1), kind: 'plaza' },
      { tile: p(1, 1), kind: 'plaza' }, { tile: p(2, 1), kind: 'plaza' },
    ]);
    expect([0, 1, 2].map(x => traversalCostX10(world, p(x, 0)))).toEqual([10, 11, 12]);
    expect(traversalCostX10(world, p(0, 1))).toBeNull();
    expect(traversalCostX10(world, p(1, 1))).toBe(20);
    expect(traversalCostX10(world, p(2, 1))).toBe(10);
    expect(findWeightedPath(world, p(2, 1), p(0, 0))).not.toBeNull();
    const corrupted = miniature(['rr'], [{ tile: p(1, 0), kind: 'broken' as 'main' }]);
    expect(traversalCostX10(corrupted, p(1, 0))).toBe(10);
  });

  it('gives deterministic tie order and does not mutate inputs, RNG, or BFS diagnostics', () => {
    const world = miniature(['ggggg', 'ggggg', 'ggggg']);
    const initial = JSON.stringify(world);
    resetPathfindingDiagnostics(); resetWeightedPathDiagnostics();
    const first = findWeightedPath(world, p(0, 0), p(4, 2))!;
    for (let n = 0; n < 40; n += 1) expect(findWeightedPath(world, p(0, 0), p(4, 2))).toEqual(first);
    expect(JSON.stringify(world)).toBe(initial);
    expect(getWeightedPathDiagnostics().calls).toBe(41);
    expect(getPathfindingDiagnostics()).toBe(0);
    findPath(world, p(0, 0), p(4, 2));
    expect(getPathfindingDiagnostics()).toBe(1);
    assertCardinal(world, p(0, 0), p(4, 2), first);
  });

  it('has no zero/negative/NaN movement edges', () => {
    const world = miniature(['rgfw']);
    for (let x = 0; x < 4; x += 1) {
      const value = traversalCostX10(world, p(x, 0));
      expect(value === null || Number.isFinite(value) && value > 0).toBe(true);
    }
  });

  it('matches optimal Dijkstra cost/reachability on 50 varied grids x 12 pairs', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const alphabet = 'ggggffrrww';
      const rows = Array.from({ length: 7 }, (_, y) =>
        Array.from({ length: 8 }, (_, x) => alphabet[(seed * 17 + x * 31 + y * 19 + x * y * 7) % alphabet.length]!).join(''));
      const kinds = ['main', 'plaza', 'side', 'footpath'] as const;
      const roads = Array.from({ length: 7 }, (_, y) =>
        Array.from({ length: 8 }, (_, x) => ({ tile: p(x, y), kind: kinds[(x + y + seed) % 4]! }))).flat();
      const world = miniature(rows, roads);
      for (let i = 0; i < 12; i += 1) {
        const from = p((seed + i * 3) % 8, (i * 2 + seed) % 7);
        const to = p((seed * 3 + i * 5) % 8, (seed + i * 4) % 7);
        const path = findWeightedPath(world, from, to);
        const expected = dijkstra(world, from, to);
        expect(path === null).toBe(expected === null);
        if (path) {
          assertCardinal(world, from, to, path);
          expect(cost(world, path)).toBe(expected);
          expect(findWeightedPath(world, from, to)).toEqual(path);
        }
      }
    }
  });

  it('works for real 48 legacy and 96 subtype worlds, including valid sites/entrances', () => {
    const legacy = createWorld(613, 50);
    const modern = createWorld96(12345, 100);
    const snapshots = [JSON.stringify(legacy), JSON.stringify(modern)];
    for (const world of [legacy, modern]) {
      const targets = [...world.sites.map(site => site.tile),
        ...world.resourceNodes.map(node => node.tile)].slice(0, 25);
      for (const target of targets) {
        const start = world.citizens[0]!.tile;
        const bfs = findPath(world, start, target);
        const metrics: WeightedPathStats = { expandedNodes: -1, totalCostX10: null };
        const path = findWeightedPath(world, start, target, metrics);
        expect(path === null).toBe(bfs === null);
        if (path) {
          assertCardinal(world, start, target, path);
          expect(cost(world, path)).toBe(metrics.totalCostX10);
          expect(cost(world, path)).toBeLessThanOrEqual(cost(world, bfs!));
          expect(metrics.expandedNodes).toBeGreaterThanOrEqual(0);
          if (path.length > 0) expect(metrics.expandedNodes).toBeGreaterThan(0);
        }
      }
    }
    for (const entrance of modern.layout.entrances) {
      expect(traversalCostX10(modern, entrance.tile)).toBeGreaterThan(0);
      expect(findWeightedPath(modern, modern.citizens[0]!.tile, entrance.tile)).not.toBeNull();
    }
    const footpath = modern.layout.roads.find(road => road.kind === 'footpath')!;
    expect(traversalCostX10(modern, footpath.tile)).toBe(12);
    expect(JSON.stringify(legacy)).toBe(snapshots[0]);
    expect(JSON.stringify(modern)).toBe(snapshots[1]);
  }, 120_000);
});
