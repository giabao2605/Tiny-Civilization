import { isValidDimensions, tileIndexAt, type TilePosition } from './grid';
import { dimensionsOf, type WorldGeometry } from './world';

// Observational only; never feeds the simulation or seeded RNG.
let pathfindingCalls = 0;
export function resetPathfindingDiagnostics(): void { pathfindingCalls = 0; }
export function getPathfindingDiagnostics(): number { return pathfindingCalls; }

/**
 * Exact shortest-path BFS, preserving N/E/S/W exploration order and v5/v6
 * semantics. Numeric neighbors avoid four tile objects and repeated dimension
 * validation for every visited cell on the 96x96 hot path.
 */
export function findPath(world: WorldGeometry, start: TilePosition, end: TilePosition): TilePosition[] | null {
  pathfindingCalls += 1;
  const dimensions = dimensionsOf(world);
  if (!isValidDimensions(dimensions) ||
    world.tiles.length !== dimensions.width * dimensions.height) return null;
  const first = tileIndexAt(start, dimensions);
  const last = tileIndexAt(end, dimensions);
  if (first === null || last === null ||
    world.tiles[first] === 'water' || world.tiles[last] === 'water') return null;
  if (first === last) return [];
  const width = dimensions.width;
  const height = dimensions.height;
  const previous = new Int32Array(world.tiles.length).fill(-1);
  const queue = new Int32Array(world.tiles.length);
  let head = 0;
  let tail = 1;
  queue[0] = first;
  previous[first] = first;
  while (head < tail) {
    const current = queue[head++]!;
    const x = current % width;
    const y = Math.floor(current / width);
    // Keep the legacy tie-breaking order unchanged: north, east, south, west.
    for (let direction = 0; direction < 4; direction++) {
      let next: number;
      if (direction === 0) {
        if (y === 0) continue;
        next = current - width;
      } else if (direction === 1) {
        if (x + 1 >= width) continue;
        next = current + 1;
      } else if (direction === 2) {
        if (y + 1 >= height) continue;
        next = current + width;
      } else {
        if (x === 0) continue;
        next = current - 1;
      }
      if (previous[next] !== -1 || world.tiles[next] === 'water') continue;
      previous[next] = current;
      if (next === last) {
        const reversed: TilePosition[] = [];
        for (let index = last; index !== first; index = previous[index]!) {
          reversed.push({ x: index % width, y: Math.floor(index / width) });
        }
        return reversed.reverse();
      }
      queue[tail++] = next;
    }
  }
  return null;
}
