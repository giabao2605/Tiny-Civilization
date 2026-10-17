import { describe, expect, it } from 'vitest';
import { cpus } from 'node:os';
import { createWorld, type WorldState } from './world';
import { createWorld96 } from './world96';
import { findPath } from './pathfinding';
import { findWeightedPath, traversalCostX10, type WeightedPathStats } from './weightedPathfinding';
import type { TilePosition } from './grid';

const quantile = (v: number[], p: number): number =>
  v.length ? [...v].sort((a, b) => a - b)[Math.ceil(p * v.length) - 1]! : 0;
const precision = (v: number) => +v.toFixed(4);
const cost = (w: WorldState, path: TilePosition[]): number =>
  path.reduce((sum, step) => sum + traversalCostX10(w, step)!, 0);

describe('N03-B Node microbenchmark, not a GPU/FPS claim', () => {
  for (const size of [48, 96] as const) for (const count of [20, 50, 100] as const) {
    it('samples ' + size + 'x' + size + ' at population ' + count, () => {
      const world = size === 48 ? createWorld(613, count) : createWorld96(12345, count);
      const targets = [...world.sites, ...world.resourceNodes].map(item => item.tile);
      const pairs = world.citizens.slice(0, count).map((citizen, i) => ({
        start: citizen.tile, end: targets[(i * 17 + Math.floor(i / 4)) % targets.length]!,
      }));
      pairs.push({ start: world.citizens[0]!.tile, end: world.citizens[0]!.tile });
      pairs.push({ start: world.citizens[0]!.tile, end: { x: size - 1, y: size - 1 } });
      const water = world.tiles.findIndex(tile => tile === 'water');
      if (water >= 0) pairs.push({ start: world.citizens[0]!.tile,
        end: { x: water % size, y: Math.floor(water / size) } });
      const bfsMs: number[] = [], aMs: number[] = [];
      const bfsLength: number[] = [], aLength: number[] = [], bfsCost: number[] = [], aCost: number[] = [];
      const expanded: number[] = [];
      let reachable = 0;
      pairs.forEach((pair, i) => {
        const stats: WeightedPathStats = { expandedNodes: 0, totalCostX10: null };
        let bfs: TilePosition[] | null = null, astar: TilePosition[] | null = null;
        if (i % 2 === 0) {
          let start = performance.now(); bfs = findPath(world, pair.start, pair.end);
          bfsMs.push(performance.now() - start);
          start = performance.now(); astar = findWeightedPath(world, pair.start, pair.end, stats);
          aMs.push(performance.now() - start);
        } else {
          let start = performance.now(); astar = findWeightedPath(world, pair.start, pair.end, stats);
          aMs.push(performance.now() - start);
          start = performance.now(); bfs = findPath(world, pair.start, pair.end);
          bfsMs.push(performance.now() - start);
        }
        expect(astar === null).toBe(bfs === null);
        if (bfs && astar) {
          reachable += 1;
          const bc = cost(world, bfs), ac = cost(world, astar);
          expect(ac).toBeLessThanOrEqual(bc);
          expect(stats.totalCostX10).toBe(ac);
          bfsLength.push(bfs.length); aLength.push(astar.length); bfsCost.push(bc); aCost.push(ac);
        }
        expanded.push(stats.expandedNodes);
      });
      console.log('N03B_PATH_BENCH', JSON.stringify({
        size, count, seed: size === 48 ? 613 : 12345,
        node: process.version, platform: process.platform, cpu: cpus()[0]?.model ?? 'unknown',
        method: 'one warm-up-free sample per pair; alternate algorithm order; noisy CI microbenchmark',
        calls: pairs.length, reachable,
        bfsP50: precision(quantile(bfsMs, .5)), bfsP95: precision(quantile(bfsMs, .95)),
        astarP50: precision(quantile(aMs, .5)), astarP95: precision(quantile(aMs, .95)),
        bfsLengthP50: quantile(bfsLength, .5), astarLengthP50: quantile(aLength, .5),
        bfsCostP50: quantile(bfsCost, .5), astarCostP50: quantile(aCost, .5),
        expandedP50: quantile(expanded, .5), expandedP95: quantile(expanded, .95),
        heapAllocation: 'not measured reliably', physicalWindows: 'PARTIAL',
      }));
    }, 120_000);
  }
});
