import { isValidDimensions, tileIndexAt, type TilePosition } from './grid';
import { dimensionsOf, type WorldGeometry } from './world';
import type { Road96Kind } from './world96Layout';

/** Walkability is authoritative in tiles. Layout only annotates actual road tiles. */
export type WeightedWorld = WorldGeometry & {
  readonly layout?: { readonly roads: readonly { readonly tile: TilePosition; readonly kind: Road96Kind }[] };
};
export type WeightedPathStats = { expandedNodes: number; totalCostX10: number | null };

export const MOVEMENT_COST_X10 = Object.freeze({
  main: 10, plaza: 10, side: 11, footpath: 12,
  road: 10, grass: 20, forest: 25,
});

let weightedPathCalls = 0;
let weightedNodesExpanded = 0;
export function resetWeightedPathDiagnostics(): void {
  weightedPathCalls = 0;
  weightedNodesExpanded = 0;
}
export function getWeightedPathDiagnostics(): Readonly<{ calls: number; expandedNodes: number }> {
  return { calls: weightedPathCalls, expandedNodes: weightedNodesExpanded };
}

function roadCost(kind: Road96Kind): number {
  switch (kind) {
    case 'main': return MOVEMENT_COST_X10.main;
    case 'plaza': return MOVEMENT_COST_X10.plaza;
    case 'side': return MOVEMENT_COST_X10.side;
    case 'footpath': return MOVEMENT_COST_X10.footpath;
    default: return MOVEMENT_COST_X10.road;
  }
}

/** External cost probe. Water/out-of-bounds/invalid terrain is never traversable. */
export function traversalCostX10(world: WeightedWorld, tile: TilePosition): number | null {
  const dim = dimensionsOf(world);
  if (!isValidDimensions(dim) || world.tiles.length !== dim.width * dim.height) return null;
  const index = tileIndexAt(tile, dim);
  if (index === null) return null;
  const terrain = world.tiles[index];
  if (terrain === 'water') return null;
  if (terrain === 'grass') return MOVEMENT_COST_X10.grass;
  if (terrain === 'forest') return MOVEMENT_COST_X10.forest;
  if (terrain !== 'road') return null;
  if (world.schemaVersion === 6 && world.layout) {
    for (const road of world.layout.roads) {
      if (road.tile.x === tile.x && road.tile.y === tile.y) return roadCost(road.kind);
    }
  }
  return MOVEMENT_COST_X10.road;
}

/** Internal zero represents blocked, never a traversable edge cost. No cache. */
function costBuffer(world: WeightedWorld): Uint8Array {
  const costs = new Uint8Array(world.tiles.length);
  for (let i = 0; i < world.tiles.length; i += 1) {
    switch (world.tiles[i]) {
      case 'road': costs[i] = MOVEMENT_COST_X10.road; break;
      case 'grass': costs[i] = MOVEMENT_COST_X10.grass; break;
      case 'forest': costs[i] = MOVEMENT_COST_X10.forest; break;
    }
  }
  if (world.schemaVersion === 6 && world.layout) {
    const dim = dimensionsOf(world);
    for (const road of world.layout.roads) {
      const i = tileIndexAt(road.tile, dim);
      if (i !== null && world.tiles[i] === 'road') costs[i] = roadCost(road.kind);
    }
  }
  return costs;
}

type Entry = { index: number; g: number; f: number };
function smaller(a: Entry, b: Entry): boolean {
  return a.f < b.f || a.f === b.f &&
    (a.g < b.g || a.g === b.g && a.index < b.index);
}

/** Binary heap with a total, stable priority: (f,g,tileIndex). */
class MinHeap {
  private readonly values: Entry[] = [];
  get length(): number { return this.values.length; }
  push(value: Entry): void {
    const values = this.values;
    let i = values.length;
    values.push(value);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!smaller(value, values[p]!)) break;
      values[i] = values[p]!;
      i = p;
    }
    values[i] = value;
  }
  pop(): Entry {
    const values = this.values;
    const first = values[0]!;
    const last = values.pop()!;
    if (values.length === 0) return first;
    let i = 0;
    while (true) {
      const left = i * 2 + 1;
      if (left >= values.length) break;
      const right = left + 1;
      const next = right < values.length && smaller(values[right]!, values[left]!) ? right : left;
      if (!smaller(values[next]!, last)) break;
      values[i] = values[next]!;
      i = next;
    }
    values[i] = last;
    return first;
  }
}

/**
 * Deterministic optimal four-direction A*. Edge cost is destination tile cost.
 * Does not consume world RNG or touch engine.ts; production BFS is unchanged.
 */
export function findWeightedPath(world: WeightedWorld, start: TilePosition, end: TilePosition,
  stats?: WeightedPathStats): TilePosition[] | null {
  weightedPathCalls += 1;
  let expanded = 0;
  const finish = (route: TilePosition[] | null, cost: number | null): TilePosition[] | null => {
    weightedNodesExpanded += expanded;
    if (stats) { stats.expandedNodes = expanded; stats.totalCostX10 = cost; }
    return route;
  };
  const dim = dimensionsOf(world);
  if (!isValidDimensions(dim) || world.tiles.length !== dim.width * dim.height) return finish(null, null);
  const first = tileIndexAt(start, dim);
  const last = tileIndexAt(end, dim);
  if (first === null || last === null) return finish(null, null);
  const costs = costBuffer(world);
  if (!costs[first] || !costs[last]) return finish(null, null);
  if (first === last) return finish([], 0);
  const width = dim.width, height = dim.height;
  const best = new Float64Array(costs.length).fill(Infinity);
  const parent = new Int32Array(costs.length).fill(-1);
  const visited = new Uint8Array(costs.length);
  const heuristic = (index: number): number => (
    Math.abs(index % width - end.x) + Math.abs(Math.floor(index / width) - end.y)
  ) * MOVEMENT_COST_X10.main;
  const open = new MinHeap();
  best[first] = 0;
  open.push({ index: first, g: 0, f: heuristic(first) });
  while (open.length) {
    const item = open.pop();
    const current = item.index;
    if (visited[current] || item.g !== best[current]) continue;
    visited[current] = 1;
    expanded += 1;
    if (current === last) {
      const reversed: TilePosition[] = [];
      for (let i = last; i !== first; i = parent[i]!) {
        reversed.push({ x: i % width, y: Math.floor(i / width) });
      }
      return finish(reversed.reverse(), best[last]!);
    }
    const x = current % width, y = Math.floor(current / width);
    // N / E / S / W: same orientation as legacy BFS, total order from heap.
    for (let direction = 0; direction < 4; direction += 1) {
      let next: number;
      if (direction === 0) { if (y === 0) continue; next = current - width; }
      else if (direction === 1) { if (x + 1 >= width) continue; next = current + 1; }
      else if (direction === 2) { if (y + 1 >= height) continue; next = current + width; }
      else { if (x === 0) continue; next = current - 1; }
      if (!costs[next] || visited[next]) continue;
      const g = item.g + costs[next]!;
      if (g >= best[next]!) continue;
      best[next] = g;
      parent[next] = current;
      open.push({ index: next, g, f: g + heuristic(next) });
    }
  }
  return finish(null, null);
}
