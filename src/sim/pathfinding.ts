import { GRID_WIDTH, isValidTile, tileIndex, type TilePosition } from './grid';
import { walkable, type WorldState } from './world';

// Stable neighbor ordering gives stable shortest paths for a given map.
const DIRECTIONS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

export function findPath(world: Pick<WorldState, 'tiles'>, start: TilePosition, end: TilePosition): TilePosition[] | null {
  if (!isValidTile(start) || !isValidTile(end) || !walkable(world, start) || !walkable(world, end)) return null;
  const first = tileIndex(start)!;
  const last = tileIndex(end)!;
  if (first === last) return [];
  const previous = new Int32Array(world.tiles.length).fill(-1);
  const queue = new Int32Array(world.tiles.length);
  let head = 0;
  let tail = 1;
  queue[0] = first;
  previous[first] = first;
  while (head < tail) {
    const current = queue[head++]!;
    const x = current % GRID_WIDTH;
    const y = Math.floor(current / GRID_WIDTH);
    for (const delta of DIRECTIONS) {
      const tile = { x: x + delta.x, y: y + delta.y };
      const next = tileIndex(tile);
      if (next === null || previous[next] !== -1 || !walkable(world, tile)) continue;
      previous[next] = current;
      if (next === last) {
        const reversed: TilePosition[] = [];
        for (let index = last; index !== first; index = previous[index]!) {
          reversed.push({ x: index % GRID_WIDTH, y: Math.floor(index / GRID_WIDTH) });
        }
        return reversed.reverse();
      }
      queue[tail++] = next;
    }
  }
  return null;
}
