import { isValidDimensions, tileIndexAt, tilePositionAt, type TilePosition } from './grid';
import { dimensionsOf, walkable, type WorldGeometry } from './world';

// Stable neighbor ordering gives stable shortest paths for a given map.
// Diagnostics are observational only: they never influence path selection or WorldState.
let pathfindingCalls = 0;
export function resetPathfindingDiagnostics(): void { pathfindingCalls = 0; }
export function getPathfindingDiagnostics(): number { return pathfindingCalls; }

const DIRECTIONS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

export function findPath(world: WorldGeometry, start: TilePosition, end: TilePosition): TilePosition[] | null {
  pathfindingCalls += 1;
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
