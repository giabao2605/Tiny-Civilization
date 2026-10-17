import { describe, expect, it } from 'vitest';
import { isValidDimensions, tileIndexAt, tilePositionAt, type TilePosition } from './grid';
import { createWorld, dimensionsOf, walkable, type WorldGeometry } from './world';
import { createWorld96 } from './world96';
import { findPath } from './pathfinding';

/** Frozen W02-E reference BFS, kept in a test only for exact route parity. */
function oldBfs(world: WorldGeometry, start: TilePosition, end: TilePosition): TilePosition[] | null {
  const dimensions = dimensionsOf(world);
  if (!isValidDimensions(dimensions) ||
    world.tiles.length !== dimensions.width * dimensions.height) return null;
  const first = tileIndexAt(start, dimensions);
  const last = tileIndexAt(end, dimensions);
  if (first === null || last === null || !walkable(world, start) || !walkable(world, end)) return null;
  if (first === last) return [];
  const previous = new Int32Array(world.tiles.length).fill(-1);
  const queue = new Int32Array(world.tiles.length);
  let head = 0;
  let tail = 1;
  queue[0] = first;
  previous[first] = first;
  const DIRECTIONS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  while (head < tail) {
    const current = queue[head++]!;
    const cell = tilePositionAt(current, dimensions)!;
    for (const delta of DIRECTIONS) {
      const tile = { x: cell.x + delta.x, y: cell.y + delta.y };
      const next = tileIndexAt(tile, dimensions);
      if (next === null || previous[next] !== -1 || !walkable(world, tile)) continue;
      previous[next] = current;
      if (next === last) {
        const reversed: TilePosition[] = [];
        for (let index = last; index !== first; index = previous[index]!) {
          reversed.push(tilePositionAt(index, dimensions)!);
        }
        return reversed.reverse();
      }
      queue[tail++] = next;
    }
  }
  return null;
}

describe('W02-F numeric BFS preserves legacy route identity', () => {
  for (const mode of ['48', '96'] as const) {
    it('matches frozen N/E/S/W paths and compares timing on ' + mode + ' world', () => {
      const world = mode === '48' ? createWorld(613, 50) : createWorld96(103, 100);
      const starts = world.citizens.slice(0, 24).map(c => c.tile);
      const ends = [...world.sites.map(s => s.tile), ...world.resourceNodes.map(n => n.tile)];
      const pairs = starts.map((start, i) => [start, ends[(i * 7 + 11) % ends.length]!] as const);
      // Identical input sequence and no gameplay RNG/WorldState mutations.
      const beginOld = performance.now();
      const original = pairs.map(([start, end]) => oldBfs(world, start, end));
      const oldMs = performance.now() - beginOld;
      const beginNew = performance.now();
      const revised = pairs.map(([start, end]) => findPath(world, start, end));
      const newMs = performance.now() - beginNew;
      expect(revised).toEqual(original);
      expect(findPath(world, { x: -1, y: 0 }, ends[0]!)).toBeNull();
      expect(findPath(world, ends[0]!, ends[0]!)).toEqual([]);
      console.log('W02-F-PATH-A-B', JSON.stringify({
        mode, seed: mode === '48' ? 613 : 103, cases: pairs.length,
        oldMs: +oldMs.toFixed(3), optimizedMs: +newMs.toFixed(3),
        note: 'single-process diagnostic only, not proof of GPU FPS',
      }));
    }, 120_000);
  }
});
