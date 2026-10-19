import { describe, expect, it } from 'vitest';
import type { TilePosition } from './grid';
import { findPath } from './pathfinding';
import { getRoutingDiagnostics, resetRoutingDiagnostics, resolvePath } from './routing';
import { traversalCostX10, type WeightedWorld } from './weightedPathfinding';

const p = (x: number, y: number): TilePosition => ({ x, y });
function grid(rows: string[]): WeightedWorld {
  return {
    schemaVersion: 6, map: { width: rows[0]!.length, height: rows.length },
    tiles: rows.join('').split('').map(ch => ch === 'r' ? 'road' as const : 'grass' as const),
  };
}
function cost(world: WeightedWorld, path: TilePosition[]): number {
  return path.reduce((sum, at) => sum + traversalCostX10(world, at)!, 0);
}

describe('N03-C safe weighted routes preserve in-game hourly BFS checkpoints', () => {
  it('accepts cheaper equal-duration route within a single game hour', () => {
    const world = grid(['rgg', 'rrg', 'rrr']);
    const start = p(0, 0), end = p(2, 2);
    const baseline = findPath(world, start, end)!;
    resetRoutingDiagnostics();
    const selected = resolvePath(world, start, end, 'weighted')!;
    expect(selected.length).toBe(baseline.length);
    expect(selected.at(-1)).toEqual(end);
    expect(cost(world, selected)).toBeLessThan(cost(world, baseline));
    expect(getRoutingDiagnostics()).toEqual({
      calls: 1, unreachable: 0, weightedAccepted: 1, bfsFallbacks: 0,
    });
    expect(resolvePath(world, start, end, 'weighted')).toEqual(selected);
  });

  it('rejects a weighted tie route whose intermediate game-hour position differs', () => {
    const world = grid(['rgggg', 'rgggg', 'rgggg', 'rgggg', 'rrrrr']);
    const start = p(0, 0), end = p(4, 4);
    const baseline = findPath(world, start, end)!;
    resetRoutingDiagnostics();
    const selected = resolvePath(world, start, end, 'weighted')!;
    expect(selected).toEqual(baseline);
    expect(getRoutingDiagnostics()).toEqual({
      calls: 1, unreachable: 0, weightedAccepted: 0, bfsFallbacks: 1,
    });
  });

  it('retains impossible/zero-length and explicit BFS behavior', () => {
    const world = grid(['rgg', 'rgg', 'rrr']);
    resetRoutingDiagnostics();
    expect(resolvePath(world, p(0, 0), p(0, 0), 'weighted')).toEqual([]);
    expect(resolvePath(world, p(0, 0), p(10, 10), 'weighted')).toBeNull();
    expect(resolvePath(world, p(0, 0), p(2, 2), 'bfs'))
      .toEqual(findPath(world, p(0, 0), p(2, 2)));
    expect(getRoutingDiagnostics()).toEqual({
      calls: 3, unreachable: 1, weightedAccepted: 0, bfsFallbacks: 0,
    });
  });
});
